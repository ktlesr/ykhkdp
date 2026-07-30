import { degerlendir, istemciSec, karsiGorus, modelSnapshot, naceOner } from "@ykh/ai-gateway";
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
        il: string; il_kod: string; ajans_kod: string; agirliklar: Record<string, number> }[]
    >`
      select o.id, o.baslik, o.gerekce, o.ilce, o.nace_kod,
             i.ad as il, i.kod as il_kod, i.ajans_kod,
             -- Dayanak kapsaması kriter payıyla çarpılır: "neden burada?"
             -- dayanaksız kalmak, küçük paylı bir kriterin dayanaksız
             -- kalmasından pahalıdır.
             s.agirliklar
      from oneri o
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
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
    agirliklar: o.agirliklar,
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

  const kunye = (belgeId: number) => {
    const b2 = belgeler.find((x) => x.id === belgeId);
    return { belge_ad: b2?.ad ?? "", bolum: b2?.bolum ?? null };
  };

  const alintiKaydi = s.dogrulanan.map((a) => ({
    belge_id: a.belge_id,
    ...kunye(a.belge_id),
    alinti: a.alinti,
  }));

  // ── 3b. Karşı görüş · EN İYİ ÇABA ────────────────────────────────────────
  //
  // Puanlama fail-closed: doğrulanmayan çıktı kaydedilmez, çünkü sıralamaya
  // giren bir sayı üretiyor. Karşı görüş insanın okuyacağı bir metin ve puana
  // etki etmiyor; üretilemezse değerlendirmeyi ENGELLEMEZ, denetime yazılır.
  // İÇERİĞİ yine fail-closed: doğrulanmamış alıntı kaydedilmez.
  const k = await karsiGorus(istemci, model, {
    baslik: o.baslik,
    gerekce: o.gerekce,
    il: o.il,
    ilce: o.ilce,
    belgeler,
    paket,
  });
  aiMaliyeti({
    model,
    girdiToken: k.ok ? k.maliyet.girdiToken : 0,
    ciktiToken: k.ok ? k.maliyet.ciktiToken : 0,
    promptSurum: k.promptSurum,
    sonuc: k.ok ? "ok" : "red",
  });

  const karsiGorusKaydi = k.ok
    ? k.gorusler.map((g) => ({
        tur: g.tur,
        iddia: g.iddia,
        alintilar: g.alintilar.map((a) => ({ ...kunye(a.belge_id), alinti: a.alinti })),
      }))
    : [];
  if (k.ok) {
    notlar.push(k.gorusler.length ? `${k.gorusler.length} karşı görüş` : "karşı görüş bulunamadı");
  } else {
    notlar.push(`karşı görüş üretilemedi (${k.asama})`);
  }

  await islem(b, async (sql) => {
    /**
     * Yeniden değerlendirme kısmi güncelleme DEĞİL, yeni bir değerlendirmedir.
     *
     * `puanlar` ve `kriter_dayanagi` trigger ile donuk; `on conflict do update`
     * yalnızca dayanak ve alıntıları yenileyebiliyordu. O yol eski puanı yeni
     * alıntı listesiyle eşleştiriyor ve kriter eşlemesi yanlış alıntıyı
     * gösteriyordu. Bunun yerine eski satır denetime yazılıp silinir.
     */
    const [onceki] = await sql<{ puanlar: unknown; dayanak: number; model_snapshot: string; prompt_surum: string }[]>`
      delete from degerlendirme where oneri_id = ${oneriId}
      returning puanlar, dayanak, model_snapshot, prompt_surum
    `;
    if (onceki) {
      await denetle(sql, b, "degerlendirme_degistirildi", "oneri", oneriId, {
        onceki,
        not: "Yeniden değerlendirildi; önceki AI çıktısı bu kayıtla korunur.",
      });
    }

    await sql`
      insert into degerlendirme
        (oneri_id, puanlar, kriter_dayanagi, dayanak, gerekce, alintilar,
         karsi_gorus, karsi_gorus_surum, model_snapshot, prompt_surum)
      values (${oneriId}, ${sql.json(puanlar as never)}, ${sql.json(s.kriterDayanagi as never)},
              ${s.dayanak}, ${s.veri.gerekce}, ${sql.json(alintiKaydi as never)},
              ${sql.json(karsiGorusKaydi as never)}, ${k.ok ? k.promptSurum : null},
              ${s.modelSnapshot}, ${s.promptSurum})
    `;
    // Puan hazır ama DOĞRULANMADI → ajans onayı bekler.
    await sql`
      update oneri set durum = 'onay_bekliyor', son_hata = null, guncellendi = now()
      where id = ${oneriId}
    `;
    await denetle(sql, b, "degerlendirme_yapildi", "oneri", oneriId, {
      dayanak: s.dayanak,
      alintiSayisi: s.dogrulanan.length,
      kriterDayanagi: s.kriterDayanagi,
      dayanaksizKriter: Object.entries(s.kriterDayanagi)
        .filter(([, v]) => !v.length)
        .map(([k]) => k),
      dusenAlinti: s.dusenler,
      duzeltilenAtif: s.duzeltilenler,
      karsiGorus: k.ok
        ? { adet: k.gorusler.length, turler: k.gorusler.map((g) => g.tur), dusenler: k.dusenler }
        : { hata: k.asama, hatalar: k.hatalar },
      model: s.modelSnapshot,
      promptSurum: s.promptSurum,
      not: "Doğrulanmamış taslak puan — ajans onayı olmadan sıralamaya girmez.",
    });
  });

  const dayanaksiz = Object.values(s.kriterDayanagi).filter((v) => !v.length).length;
  notlar.push(
    `puan hazır, dayanak ${s.dayanak}/100, ${s.dogrulanan.length} doğrulanmış alıntı` +
      (dayanaksiz ? `, ${dayanaksiz} kriter dayanaksız` : "") +
      (s.dusenler.length ? ` (${s.dusenler.length} alıntı düşürüldü)` : ""),
  );
  log.info("degerlendirme_tamam", { oneriId, dayanak: s.dayanak });
  return { asama: "tamam", ok: true, mesaj: notlar.join(" · "), dayanak: s.dayanak, naceKod };
}
