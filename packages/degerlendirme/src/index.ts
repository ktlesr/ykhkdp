import { degerlendir, istemciSec, modelSnapshot, naceOner } from "@ykh/ai-gateway";
import { denetle, islem, type Baglam } from "@ykh/database";
import { aiMaliyeti, log } from "@ykh/observability";
import { belgePaketi, naceAdaylari } from "@ykh/retrieval";

/**
 * Değerlendirme işi. Worker döngüsü ve web'deki "şimdi değerlendir" eylemi
 * AYNI fonksiyonu çağırır — tek kod yolu, tek davranış.
 *
 * Doğrulamadan geçmeyen AI çıktısı KAYDEDİLMEZ (fail-closed); yalnızca
 * denetime yazılır ve öneri `degerlendiriliyor` durumunda kalır.
 */

export const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };

export type Asama = "oneri" | "nace" | "belge" | "model" | "kayit" | "tamam";

export type Sonuc = { asama: Asama; ok: boolean; mesaj: string; dayanak?: number; naceKod?: string };

export async function degerlendirmeYap(b: Baglam, oneriId: number): Promise<Sonuc> {
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
  if (!o) return { asama: "oneri", ok: false, mesaj: `Öneri bulunamadı: ${oneriId}` };

  const istemci = istemciSec();
  const model = modelSnapshot();
  const notlar: string[] = [];
  let naceKod = o.nace_kod ?? undefined;

  // ── 1. NACE · yalnızca kullanıcı girmediyse ──────────────────────────────
  if (!o.nace_kod) {
    const adaylar = await naceAdaylari(b, `${o.baslik} ${o.gerekce}`);
    const n = await naceOner(istemci, model, { baslik: o.baslik, gerekce: o.gerekce, adaylar });
    aiMaliyeti({
      model,
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
      naceKod = secilen.kod;
      notlar.push(`NACE ${secilen.kod} atandı (${secilen.guven} güven)`);
    } else {
      await islem(b, (sql) =>
        denetle(sql, b, "nace_ai_reddedildi", "oneri", oneriId, { asama: n.asama, hatalar: n.hatalar }),
      );
      if (n.asama === "model") {
        return { asama: "nace", ok: false, mesaj: `Model erişimi başarısız: ${n.hatalar[0] ?? ""}` };
      }
      notlar.push("NACE atanamadı");
    }
  }

  // ── 2. Belge paketi ──────────────────────────────────────────────────────
  const { paket, belgeler } = await belgePaketi(b, {
    ilKod: o.il_kod,
    ajansKod: o.ajans_kod,
    sorgu: `${o.baslik} ${o.gerekce}`,
  });
  if (!belgeler.length) {
    return {
      asama: "belge",
      ok: false,
      mesaj:
        "Bu il için üst ölçekli belge yok; değerlendirme yapılamıyor. " +
        "Belgeler ekranından en az bir belge yükleyin.",
      naceKod,
    };
  }

  // ── 3. Model ─────────────────────────────────────────────────────────────
  const s = await degerlendir(istemci, model, {
    baslik: o.baslik,
    gerekce: o.gerekce,
    il: o.il,
    ilce: o.ilce,
    nace: naceKod ?? null,
    belgeler,
    paket,
  });
  aiMaliyeti({
    model,
    girdiToken: s.ok ? s.maliyet.girdiToken : 0,
    ciktiToken: s.ok ? s.maliyet.ciktiToken : 0,
    promptSurum: s.promptSurum,
    sonuc: s.ok ? "ok" : "red",
  });

  if (!s.ok) {
    await islem(b, (sql) =>
      denetle(sql, b, "degerlendirme_reddedildi", "oneri", oneriId, {
        asama: s.asama,
        hatalar: s.hatalar,
        model: s.modelSnapshot,
        promptSurum: s.promptSurum,
      }),
    );
    return {
      asama: "model",
      ok: false,
      mesaj: `Reddedildi (${s.asama}): ${s.hatalar.slice(0, 2).join(" | ")}`,
      naceKod,
    };
  }

  // ── 4. Kayıt ─────────────────────────────────────────────────────────────
  const puanlar = Object.fromEntries(s.veri.puanlar.map((p) => [p.kriter, p.puan]));

  await islem(b, async (sql) => {
    await sql`
      insert into degerlendirme (oneri_id, puanlar, dayanak, gerekce, alintilar, model_snapshot, prompt_surum)
      values (${oneriId}, ${sql.json(puanlar as never)}, ${s.dayanak}, ${s.veri.gerekce},
              ${sql.json(
                s.dogrulanan.map((a) => ({
                  belge_id: a.belge_id,
                  belge_ad: belgeler.find((b2) => b2.id === a.belge_id)?.ad ?? "",
                  bolum: belgeler.find((b2) => b2.id === a.belge_id)?.bolum ?? null,
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
    await sql`
      update oneri set durum = 'onay_bekliyor', son_hata = null, guncellendi = now()
      where id = ${oneriId}
    `;
    await denetle(sql, b, "degerlendirme_yapildi", "oneri", oneriId, {
      dayanak: s.dayanak,
      alintiSayisi: s.dogrulanan.length,
      dusenAlinti: s.dusenler,
      model: s.modelSnapshot,
      promptSurum: s.promptSurum,
      not: "Doğrulanmamış taslak puan — ajans onayı olmadan sıralamaya girmez.",
    });
  });

  notlar.push(
    `puan hazır, dayanak ${s.dayanak}/100, ${s.dogrulanan.length} doğrulanmış alıntı` +
      (s.dusenler.length ? ` (${s.dusenler.length} alıntı düşürüldü)` : ""),
  );
  log.info("degerlendirme_tamam", { oneriId, dayanak: s.dayanak });
  return { asama: "tamam", ok: true, mesaj: notlar.join(" · "), dayanak: s.dayanak, naceKod };
}
