import type { Aday, BosSatir, DoluSatir, Hesap, Koken, Ozet, Satir, Sonuc, UcDurum } from "@ykh/domain";
import type { AgirlikSeti } from "./kriterler.ts";
import { ayniKonuMu } from "./ayni-konu.ts";

/**
 * Sıralama ve slot doldurma. Saf fonksiyon: DB yok, UI yok, rastgelelik yok.
 *
 * Dayanak eşiği sıralamayı ezer: AI'nin üst ölçekli belgelere bağlayamadığı
 * aday, puanı yüksek olsa da slot dolduramaz. Kaynağı belirsiz bir sayı dört
 * konuyu seçemez.
 */

export type Ayar = Pick<AgirlikSeti, "devamlilikPayi" | "dayanakEsigi" | "devirSiniri" | "slotSayisi" | "surum">;

export function ayardan(set: AgirlikSeti, ezme?: Partial<Ayar>): Ayar {
  return {
    devamlilikPayi: set.devamlilikPayi,
    dayanakEsigi: set.dayanakEsigi,
    devirSiniri: set.devirSiniri,
    slotSayisi: set.slotSayisi,
    surum: set.surum,
    ...ezme,
  };
}

export function hesapla(adaylar: readonly Aday[], ayar: Ayar, secenek: { yerAdlari?: readonly string[] } = {}): Hesap {
  const { devamlilikPayi: pay, dayanakEsigi: esik, devirSiniri, slotSayisi } = ayar;

  const tumu = adaylar
    .map((k) => ({ ...k, puan: k.taban + (k.koken === "mevcut" ? pay : 0) }))
    .sort((a, b) => b.puan - a.puan || a.id.localeCompare(b.id, "tr"));

  /**
   * AYNI KONU tek kez yarışır. Başlıkları farklı yazılmış iki aday aynı
   * konuysa (`ayniKonuMu`) temsilci, dayanak eşiğini geçenler arasında puanı
   * en yüksek olandır (hiçbiri geçmiyorsa en yüksek puanlı); diğerleri
   * asıl/yedek dışında "aynı konu" olarak kalır. Canlıda iki "emniyet kemeri"
   * önerisi asıl listeye birlikte girmişti.
   */
  const yerler = secenek.yerAdlari ?? [];
  const temsilci = new Map<string, string>(); // tekrar id → temsilci adı
  const kumeler: Array<typeof tumu> = [];
  for (const k of tumu) {
    const kume = kumeler.find((c) => ayniKonuMu(c[0].ad, k.ad, yerler));
    if (kume) kume.push(k);
    else kumeler.push([k]);
  }
  for (const c of kumeler) {
    if (c.length < 2) continue;
    const bas = c.find((x) => x.dayanak >= esik) ?? c[0];
    for (const x of c) if (x !== bas) temsilci.set(x.id, bas.ad);
  }
  const liste = tumu.filter((k) => !temsilci.has(k.id));

  type Sirali = (typeof liste)[number];
  const slots: Satir[] = [];
  const kalan: Array<Sirali & { dayanaksiz: boolean }> = [];

  let i = 0;
  let sira = 1;

  while (sira <= slotSayisi && i < liste.length) {
    const aday = liste[i];

    if (aday.dayanak >= esik) {
      slots.push(satir(aday, sira, true, false, false));
      i++;
      sira++;
      continue;
    }

    kalan.push({ ...aday, dayanaksiz: true });

    let j = i + 1;
    while (j < liste.length && liste[j].dayanak < esik) j++;
    const devralan: Sirali | undefined = liste[j];

    if (devralan && aday.puan - devralan.puan <= devirSiniri) {
      slots.push(satir(devralan, sira, true, true, false));
      liste.splice(j, 1);
    } else {
      slots.push(bosSlot(sira, aday, devralan, esik));
    }
    i++;
    sira++;
  }

  // Aday bitti ama slot kaldıysa: slot sayısı ayardan gelir, aday sayısından değil.
  while (sira <= slotSayisi) {
    slots.push({
      bos: true,
      sira: sira++,
      gerekce: "Bu slot için aday kalmadı. Boş slot meşru bir sonuçtur, hata değildir.",
    });
  }

  // Slot döngüsünün dışında kalan aday da kendi dayanağıyla etiketlenir.
  for (; i < liste.length; i++) kalan.push({ ...liste[i], dayanaksiz: liste[i].dayanak < esik });

  /**
   * Asıl + yedek: çıktı en çok `slotSayisi` asıl ve `slotSayisi` yedektir.
   * Yedek sırası eşiği geçen adaylardan dolar; ötesindeki yeni öneri
   * "liste dışı" olur. Mevcut konu yedekte de olsa dışarıda da olsa
   * "çıkıyor"dur — listeden çıkıyor olması değişmez.
   */
  const puanSirasi = kalan.sort((a, b) => b.puan - a.puan || a.id.localeCompare(b.id, "tr"));
  const yedek = puanSirasi.filter((k) => !k.dayanaksiz).slice(0, slotSayisi);
  const disarida = puanSirasi.filter((k) => !yedek.includes(k));
  const tekrarlar = tumu.filter((k) => temsilci.has(k.id));
  let s = slotSayisi + 1;
  const kalanlar = [
    ...yedek.map((k) => ({ ...satir(k, s++, false, false, false), yedekte: true })),
    ...disarida.map((k) => {
      const r = satir(k, s++, false, false, k.dayanaksiz);
      return { ...r, yedekte: false, sonuc: !k.dayanaksiz && k.koken === "yeni" ? ("liste dışı" as const) : r.sonuc };
    }),
    ...tekrarlar.map((k) => ({
      ...satir(k, s++, false, false, k.dayanak < esik),
      yedekte: false,
      sonuc: "aynı konu" as const,
      ayniKonu: temsilci.get(k.id),
    })),
  ];

  const dolular = slots.filter((x): x is DoluSatir => !x.bos);
  const ozet: Ozet = {
    korunuyor: dolular.filter((x) => x.koken === "mevcut").length,
    ekleniyor: dolular.filter((x) => x.koken === "yeni").length,
    // Aynı konulu yeni sürümü listeye giren resmî konu "çıkmıyor": konu kalıyor.
    cikiyor: kalanlar.filter((x) => x.koken === "mevcut" && x.sonuc !== "aynı konu").length,
    bosSlot: slots.length - dolular.length,
  };

  const sonSlot = dolular.at(-1);
  const ilkDisarda = kalanlar[0];
  const fark = sonSlot && ilkDisarda ? sonSlot.puan - ilkDisarda.puan : null;
  const saglamlik = fark === null ? 48 : Math.max(20, Math.min(96, 46 + fark * 5));

  return {
    ilkDort: slots,
    kalanlar,
    ozet,
    fark,
    saglamlik,
    ucDurum: ucDurum(ozet, slotSayisi),
    pay,
    esik,
    agirlikSurumu: ayar.surum,
  };
}

function bosSlot(
  sira: number,
  aday: Aday & { puan: number },
  devralan: (Aday & { puan: number }) | undefined,
  esik: number,
): BosSatir {
  return {
    bos: true,
    sira,
    gerekce:
      `Sıradaki aday “${aday.ad}” (${aday.puan} puan) üst ölçekli belgelere yalnızca ${aday.dayanak}/100 ` +
      `düzeyinde bağlanabiliyor; ${esik} dayanak eşiğinin altında olduğu için slot dolduramaz. ` +
      `Eşiği geçen ilk aday “${devralan ? devralan.ad : "—"}” ` +
      `${devralan ? aday.puan - devralan.puan : "—"} puan geride olduğu için devralmadı. Slot boş bırakıldı.`,
  };
}

function satir(
  aday: Aday & { puan: number },
  sira: number,
  ilkDortte: boolean,
  esikDevri: boolean,
  dayanaksiz: boolean,
): DoluSatir {
  return { ...aday, bos: false, sira, sonuc: sonucEtiketi(aday.koken, ilkDortte, dayanaksiz), esikDevri, dayanaksiz };
}

function sonucEtiketi(koken: Koken, ilkDortte: boolean, dayanaksiz: boolean): Sonuc {
  if (ilkDortte) return koken === "mevcut" ? "korunuyor" : "ekleniyor";
  if (dayanaksiz) return "dayanaksız";
  return koken === "mevcut" ? "çıkıyor" : "yedek";
}

function ucDurum(ozet: Ozet, slotSayisi: number): UcDurum {
  if (ozet.bosSlot > 0) {
    return {
      baslik:
        ozet.bosSlot === 1
          ? `${slotSayisi} slottan biri boş kalıyor`
          : `${slotSayisi} slottan ${ozet.bosSlot} tanesi boş kalıyor`,
      metin:
        "Boş slot meşru bir sonuçtur, hata değildir. Yeterince gerekçelendirilebilir aday yok; " +
        "üst ölçekli belge eklendikçe veya öneriler güçlendikçe slot yeniden yarışa açılır.",
    };
  }
  if (ozet.korunuyor === slotSayisi) {
    return {
      baslik: `${slotSayisi} konunun tamamı korunuyor`,
      metin: "Uç durum. Ajansın gerekçesini yazması beklenir.",
    };
  }
  if (ozet.korunuyor === 0 && ozet.cikiyor > 0) {
    return {
      baslik: "mevcut konuların tamamı değişiyor",
      metin: "Uç durum. Ajansın gerekçesini yazması beklenir.",
    };
  }
  return null;
}

export function slotKimlikleri(h: Hesap): Array<string | null> {
  return h.ilkDort.map((s) => (s.bos ? null : s.id));
}
