import { degerlendir, istemciSec, modelSnapshot, naceOner } from "@ykh/ai-gateway";
import { denetle, islem, type Baglam } from "@ykh/database";
import { aiMaliyeti, log } from "@ykh/observability";
import { belgePaketi, naceAdaylari } from "@ykh/retrieval";

/**
 * İş tipleri. Doğrulamadan geçmeyen AI çıktısı KAYDEDİLMEZ (fail-closed);
 * yalnızca denetime yazılır ve öneri `degerlendiriliyor` durumunda kalır.
 */

export type IsKaydi = { id: number; tip: string; yuk: Record<string, unknown> };

export const ISLER: Record<string, (b: Baglam, yuk: Record<string, unknown>) => Promise<string>> = {
  /**
   * Bir öneriyi puanlar. Kullanıcı NACE girmediyse önce NACE atar.
   * Sonuç doğrulanmamış taslaktır → öneri `onay_bekliyor` olur.
   */
  async degerlendir(b, yuk) {
    const oneriId = Number(yuk.oneriId);

    const [o] = await islem(b, (sql) =>
      sql<
        { id: number; baslik: string; gerekce: string; ilce: string | null; nace_kod: string | null;
          il: string; il_kod: string; ajans_kod: string }[]
      >`
        select o.id, o.baslik, o.gerekce, o.ilce, o.nace_kod,
               i.ad as il, i.kod as il_kod, i.ajans_kod
        from oneri o
        join donem d on d.id = o.donem_id
        join il i on i.kod = d.il_kod
        where o.id = ${oneriId}
      `,
    );
    if (!o) throw new Error(`Öneri bulunamadı: ${oneriId}`);

    const istemci = istemciSec();
    const model = modelSnapshot();
    const notlar: string[] = [];

    // ── 1. NACE · yalnızca kullanıcı girmediyse ────────────────────────────
    if (!o.nace_kod) {
      const adaylar = await naceAdaylari(b, `${o.baslik} ${o.gerekce}`);
      const n = await naceOner(istemci, model, {
        baslik: o.baslik,
        gerekce: o.gerekce,
        adaylar,
      });
      aiMaliyeti({
        model: model,
        girdiToken: n.ok ? n.maliyet.girdiToken : 0,
        ciktiToken: n.ok ? n.maliyet.ciktiToken : 0,
        promptSurum: n.promptSurum,
        sonuc: n.ok ? "ok" : "red",
      });

      if (n.ok) {
        const secilen = n.veri.adaylar[0];
        await islem(b, async (sql) => {
          await sql`
            update oneri set nace_kod = ${secilen.kod}, nace_kaynagi = 'ai', guncellendi = now()
            where id = ${oneriId}
          `;
          await denetle(sql, b, "nace_ai_atandi", "oneri", oneriId, {
            kod: secilen.kod,
            guven: secilen.guven,
            gerekce: secilen.gerekce,
            model: n.modelSnapshot,
            promptSurum: n.promptSurum,
            not: "Doğrulanmamış atama — ajans düzeltebilir.",
          });
        });
        o.nace_kod = secilen.kod;
        notlar.push(`NACE ${secilen.kod} atandı (${secilen.guven} güven)`);
      } else {
        await islem(b, (sql) =>
          denetle(sql, b, "nace_ai_reddedildi", "oneri", oneriId, { asama: n.asama, hatalar: n.hatalar }),
        );
        notlar.push("NACE atanamadı");
      }
    }

    // ── 2. Değerlendirme ───────────────────────────────────────────────────
    const { paket, belgeler } = await belgePaketi(b, {
      ilKod: o.il_kod,
      ajansKod: o.ajans_kod,
      sorgu: `${o.baslik} ${o.gerekce}`,
    });
    if (!belgeler.length) {
      return "Üst ölçekli belge yok; değerlendirme yapılamadı. /belgeler ekranından belge yükleyin.";
    }

    const s = await degerlendir(istemci, model, {
      baslik: o.baslik,
      gerekce: o.gerekce,
      il: o.il,
      ilce: o.ilce,
      nace: o.nace_kod,
      belgeler,
      paket,
    });
    aiMaliyeti({
      model: model,
      girdiToken: s.ok ? s.maliyet.girdiToken : 0,
      ciktiToken: s.ok ? s.maliyet.ciktiToken : 0,
      promptSurum: s.promptSurum,
      sonuc: s.ok ? "ok" : "red",
    });

    if (!s.ok) {
      // Fail-closed: reddedilen çıktı kaydedilmez, öneri değerlendirmede kalır.
      await islem(b, (sql) =>
        denetle(sql, b, "degerlendirme_reddedildi", "oneri", oneriId, {
          asama: s.asama,
          hatalar: s.hatalar,
          model: s.modelSnapshot,
          promptSurum: s.promptSurum,
        }),
      );
      return `Reddedildi (${s.asama}): ${s.hatalar.slice(0, 3).join(" | ")}`;
    }

    const puanlar = Object.fromEntries(s.veri.puanlar.map((p) => [p.kriter, p.puan]));

    await islem(b, async (sql) => {
      await sql`
        insert into degerlendirme (oneri_id, puanlar, dayanak, gerekce, alintilar, model_snapshot, prompt_surum)
        values (${oneriId}, ${sql.json(puanlar as never)}, ${s.dayanak}, ${s.veri.gerekce},
                ${sql.json(
                  s.veri.alintilar.map((a) => ({
                    belge_id: a.belge_id,
                    belge_ad: belgeler.find((b2) => b2.id === a.belge_id)?.ad ?? "",
                    alinti: a.alinti,
                  })) as never,
                )},
                ${s.modelSnapshot}, ${s.promptSurum})
        on conflict (oneri_id) do update set
          dayanak = excluded.dayanak,
          gerekce = excluded.gerekce,
          alintilar = excluded.alintilar
      `;
      // Puan hazır ama DOĞRULANMADI → ajans onayı bekler.
      await sql`update oneri set durum = 'onay_bekliyor', guncellendi = now() where id = ${oneriId}`;
      await denetle(sql, b, "degerlendirme_yapildi", "oneri", oneriId, {
        dayanak: s.dayanak,
        alintiSayisi: s.veri.alintilar.length,
        model: s.modelSnapshot,
        promptSurum: s.promptSurum,
        not: "Doğrulanmamış taslak puan — ajans onayı olmadan sıralamaya girmez.",
      });
    });

    notlar.push(`puan hazır, dayanak ${s.dayanak}/100, ${s.veri.alintilar.length} alıntı`);
    log.info("degerlendirme_tamam", { oneriId, dayanak: s.dayanak });
    return notlar.join(" · ");
  },
};
