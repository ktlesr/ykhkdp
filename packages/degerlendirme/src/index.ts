import { degerlendir, istemciSec, karsiGorus, modelSnapshot, naceOner } from "@ykh/ai-gateway";
import { ayrilmisIslem, denetle, islem, kilitHavuzu, type Baglam } from "@ykh/database";
import { aiMaliyeti, log } from "@ykh/observability";
import { belgePaketi, naceAdaylari } from "@ykh/retrieval";

export { birKesifAl, kesifHatasi, kesifYap, pencerele, type KesifSonucu } from "./kesif.ts";

/**
 * Değerlendirme işi. Worker döngüsü ve web'deki "şimdi değerlendir" eylemi
 * AYNI fonksiyonu çağırır — tek kod yolu, tek davranış.
 *
 * Doğrulamadan geçmeyen AI çıktısı KAYDEDİLMEZ (fail-closed); yalnızca
 * denetime yazılır ve öneri `degerlendiriliyor` durumunda kalır.
 */

export const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };

export type Asama = "oneri" | "mesgul" | "nace" | "belge" | "model" | "kayit" | "tamam";

export type Sonuc = { asama: Asama; ok: boolean; mesaj: string; dayanak?: number; naceKod?: string };

/** Advisory kilit ad alanı — iki tamsayılı anahtarın ilki. Worker da kullanır. */
export const KILIT = 7301;

type Tx = Parameters<Parameters<typeof islem>[1]>[0];
/** Yazma işlemi: KİLİDİ TUTAN bağlantıda transaction. */
type Yaz = <T>(govde: (sql: Tx) => Promise<T>) => Promise<T>;

/** Kayıt anında öneri artık `degerlendiriliyor` değilse işlem geri alınır. */
class DurumDegisti extends Error {}

/**
 * TEK İŞ SAHİPLİĞİ. Worker ve elle tetik aynı öneriyi aynı anda işleyemez.
 *
 * `for update skip locked` yalnızca iş alma transaction'ı boyunca kilitliyor;
 * model çağrısı dakikalar sürüyor ve transaction'ı o kadar açık tutmak havuzu
 * tüketir. Bunun yerine OTURUM düzeyi advisory kilit: ayrılmış bir bağlantıda
 * tutulur, transaction açmaz. Süreç çökerse bağlantı kapanır ve kilit
 * kendiliğinden düşer — yarıda kalan iş için ayrı kurtarma adımı gerekmez;
 * öneri `degerlendiriliyor` kalır ve sonraki tur onu yeniden alır.
 */
export async function degerlendirmeYap(b: Baglam, oneriId: number): Promise<Sonuc> {
  // Kilit AYRI havuzdan: `calistir` uygulama havuzunu kullanır, ikisi birbirini
  // bekleyip kilitlenemez (bkz. `kilitHavuzu`).
  const baglanti = await kilitHavuzu().reserve();
  try {
    const [{ alindi }] = await baglanti<{ alindi: boolean }[]>`
      select pg_try_advisory_lock(${KILIT}, ${oneriId}) as alindi
    `;
    if (!alindi) {
      return { asama: "mesgul", ok: false, mesaj: "Bu öneri şu anda başka bir işlemde değerlendiriliyor." };
    }
    // Bütün YAZMALAR kilidi tutan bağlantıda: bağlantı koparsa kilit de yazma da
    // birlikte gider. Ayrı bağlantıda "kilit bizde mi" sorup sonra yazmak atomik
    // değildi — arada kilit düşüp başka bir iş başlayabiliyordu.
    const yaz: Yaz = (govde) => ayrilmisIslem(baglanti, b, govde);
    // Başarısız koşu nedeniyle birlikte KAYDA geçer — elle tetikte de. Yoksa
    // ekran durmuş bir koşuyu "çalışıyor" sanardı.
    const hataYaz = (mesaj: string) =>
      yaz((sql) => sql`update oneri set son_hata = ${mesaj} where id = ${oneriId} and durum = 'degerlendiriliyor'`);
    try {
      const s = await calistir(b, oneriId, yaz);
      if (!s.ok && s.asama !== "oneri") await hataYaz(`${s.asama}: ${s.mesaj}`);
      return s;
    } catch (e) {
      await hataYaz(e instanceof Error ? e.message : String(e)).catch(() => {});
      throw e;
    } finally {
      await baglanti`select pg_advisory_unlock(${KILIT}, ${oneriId})`;
    }
  } finally {
    baglanti.release();
  }
}

/** Değerlendirme adımları — `oneri.asama` (0016). Arayüz canlı ilerlemeyi bundan çizer. */
export const ASAMALAR = ["alindi", "nace", "belge", "model", "karsi_gorus", "kayit"] as const;
export type DegerlendirmeAsamasi = (typeof ASAMALAR)[number];

async function calistir(b: Baglam, oneriId: number, yaz: Yaz): Promise<Sonuc> {
  // İlerleme bilgisi; durum makinesine dokunmaz. Kuyruktan çıkmış öneriye yazmaz.
  // Yeni koşu başlarken önceki denemenin hatası temizlenir: arayüz "çalışıyor"
  // ile "durdu"yu son_hata'nın varlığından ayırt eder.
  const asama = (a: DegerlendirmeAsamasi) =>
    yaz((sql) => sql`
      update oneri set asama = ${a}, asama_zamani = now(),
        son_hata = case when ${a} = 'alindi' then null else son_hata end
      where id = ${oneriId} and durum = 'degerlendiriliyor'
    `);

  const [o] = await islem(b, (sql) =>
    sql<
      { id: number; baslik: string; gerekce: string; ilce: string | null; nace_kod: string | null;
        il: string; il_kod: string; ajans_kod: string; agirliklar: Record<string, number>; durum: string;
        kesif_kanit: Array<{ belge_id: number }> | null }[]
    >`
      select o.id, o.baslik, o.gerekce, o.ilce, o.nace_kod, o.durum::text as durum, o.kesif_kanit,
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
  // Kuyrukta olmayan öneri için model çağrılmaz: sonuç zaten kaydedilmeyecekti.
  if (o.durum !== "degerlendiriliyor") {
    return { asama: "oneri", ok: false, mesaj: "Öneri değerlendirme kuyruğunda değil." };
  }

  await asama("alindi");
  const istemci = istemciSec();
  const model = modelSnapshot();
  const notlar: string[] = [];
  let naceKod = o.nace_kod ?? undefined;

  // ── 1. NACE · yalnızca kullanıcı girmediyse ──────────────────────────────
  if (!o.nace_kod) {
    await asama("nace");
    const adaylar = await naceAdaylari(b, `${o.baslik} ${o.gerekce}`);
    const n = await naceOner(istemci, model, { baslik: o.baslik, gerekce: o.gerekce, adaylar });
    aiMaliyeti({
      model,
      girdiToken: n.maliyet?.girdiToken ?? 0,
      ciktiToken: n.maliyet?.ciktiToken ?? 0,
      promptSurum: n.promptSurum,
      sonuc: n.ok ? "ok" : "red",
    });

    if (n.ok) {
      const secilen = n.veri.adaylar[0];
      const yazildi = await yaz(async (sql) => {
        // Koşullu: model çalışırken ajans NACE'yi düzelttiyse ya da öneriyi
        // kuyruktan çıkardıysa AI ataması onu ezmez.
        const r = await sql`
          update oneri set nace_kod = ${secilen.kod}, nace_kaynagi = 'ai', guncellendi = now()
          where id = ${oneriId} and nace_kod is null and durum = 'degerlendiriliyor'
        `;
        if (!r.count) return false;
        await denetle(sql, b, "nace_ai_atandi", "oneri", oneriId, {
          kod: secilen.kod,
          guven: secilen.guven,
          gerekce: secilen.gerekce,
          model: n.modelSnapshot,
          promptSurum: n.promptSurum,
          not: "Doğrulanmamış atama — ajans düzeltebilir.",
        });
        return true;
      });
      if (!yazildi) {
        return { asama: "kayit", ok: false, mesaj: "Öneri bu arada değişti; AI NACE ataması yazılmadı." };
      }
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
  await asama("belge");
  const { paket, belgeler } = await belgePaketi(b, {
    ilKod: o.il_kod,
    ajansKod: o.ajans_kod,
    sorgu: `${o.baslik} ${o.gerekce}`,
    zorunlu: (o.kesif_kanit ?? []).map((x) => Number(x.belge_id)),
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
  await asama("model");
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
    girdiToken: s.maliyet?.girdiToken ?? 0,
    ciktiToken: s.maliyet?.ciktiToken ?? 0,
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
  await asama("karsi_gorus");
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
    girdiToken: k.maliyet?.girdiToken ?? 0,
    ciktiToken: k.maliyet?.ciktiToken ?? 0,
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

  await asama("kayit");
  try {
  await yaz(async (sql) => {
    // Model çalışırken ajans durumu değiştirdiyse (reddetti, "puanı hazır
    // say" dedi) geç gelen sonuç o kararı EZMEZ: hiçbir şey yazılmaz.
    const [hala] = await sql<{ id: number }[]>`
      select id from oneri where id = ${oneriId} and durum = 'degerlendiriliyor' for update
    `;
    if (!hala) throw new DurumDegisti();

    /**
     * Yeniden değerlendirme kısmi güncelleme DEĞİL, yeni bir değerlendirmedir.
     *
     * `puanlar` ve `kriter_dayanagi` trigger ile donuk; `on conflict do update`
     * yalnızca dayanak ve alıntıları yenileyebiliyordu. O yol eski puanı yeni
     * alıntı listesiyle eşleştiriyor ve kriter eşlemesi yanlış alıntıyı
     * gösteriyordu. Bunun yerine eski satır denetime yazılıp silinir.
     */
    // Önceki kaydın TAMAMI denetime gider: gerekçe, alıntılar, kriter eşlemesi,
    // karşı görüş ve ajans düzeltmesi dahil — zincir yeniden kurulabilir.
    const [onceki] = await sql<Record<string, unknown>[]>`
      delete from degerlendirme where oneri_id = ${oneriId} returning *
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
      update oneri set durum = 'onay_bekliyor', son_hata = null, asama = null, asama_zamani = null,
        guncellendi = now()
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
  } catch (e) {
    if (!(e instanceof DurumDegisti)) throw e;
    await islem(b, (sql) =>
      denetle(sql, b, "degerlendirme_atildi", "oneri", oneriId, {
        not: "Model çalışırken öneri durumu değişti; geç gelen sonuç kaydedilmedi.",
        model: s.modelSnapshot,
        promptSurum: s.promptSurum,
      }),
    );
    return {
      asama: "kayit",
      ok: false,
      mesaj: "Öneri bu arada değerlendirme dışına alındı; sonuç kaydedilmedi.",
      naceKod,
    };
  }

  const dayanaksiz = Object.values(s.kriterDayanagi).filter((v) => !v.length).length;
  notlar.push(
    `puan hazır, dayanak ${s.dayanak}/100, ${s.dogrulanan.length} doğrulanmış alıntı` +
      (dayanaksiz ? `, ${dayanaksiz} kriter dayanaksız` : "") +
      (s.dusenler.length ? ` (${s.dusenler.length} alıntı düşürüldü)` : ""),
  );
  log.info("degerlendirme_tamam", { oneriId, dayanak: s.dayanak });
  return { asama: "tamam", ok: true, mesaj: notlar.join(" · "), dayanak: s.dayanak, naceKod };
}
