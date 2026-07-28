import type { Aday, BosSatir, DoluSatir, Hesap, Koken, Ozet, Satir, Sonuc, UcDurum } from "@ykh/domain";
import type { AgirlikSeti } from "./kriterler.ts";

/**
 * Sıralama ve slot doldurma. Brief §2 sözde kodu normatiftir.
 *
 * Saf fonksiyon: DB yok, UI yok, IO yok, rastgelelik yok, tarih yok.
 * Bu paket AI olmadan tek başına çalışır ve hiçbir yerde destek sayısını
 * girdi almaz.
 */

export type Ayar = Pick<AgirlikSeti, "devamlilikPayi" | "kanitEsigi" | "devirSiniri" | "slotSayisi" | "surum">;

export function ayardan(set: AgirlikSeti, ezme?: Partial<Ayar>): Ayar {
  return {
    devamlilikPayi: set.devamlilikPayi,
    kanitEsigi: set.kanitEsigi,
    devirSiniri: set.devirSiniri,
    slotSayisi: set.slotSayisi,
    surum: set.surum,
    ...ezme,
  };
}

export function hesapla(adaylar: readonly Aday[], ayar: Ayar): Hesap {
  const { devamlilikPayi: pay, kanitEsigi: esik, devirSiniri, slotSayisi } = ayar;

  const liste = adaylar
    .map((k) => ({ ...k, puan: k.taban + (k.koken === "mevcut" ? pay : 0) }))
    .sort((a, b) => b.puan - a.puan || a.id.localeCompare(b.id, "tr"));

  type Sirali = (typeof liste)[number];
  const slots: Satir[] = [];
  const kalan: Array<Sirali & { esikAlti: boolean }> = [];

  let i = 0;
  let sira = 1;

  while (sira <= slotSayisi && i < liste.length) {
    const aday = liste[i];

    if (aday.kanit >= esik) {
      slots.push(satir(aday, sira, true, false, false));
      i++;
      sira++;
      continue;
    }

    // Eşik altı aday: sıralamada önde ama slot dolduramaz (§1 — eşik sıralamayı ezer).
    kalan.push({ ...aday, esikAlti: true });

    let j = i + 1;
    while (j < liste.length && liste[j].kanit < esik) j++;
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

  for (; i < liste.length; i++) kalan.push({ ...liste[i], esikAlti: false });

  let s = slotSayisi + 1;
  const kalanlar = kalan
    .sort((a, b) => b.puan - a.puan || a.id.localeCompare(b.id, "tr"))
    .map((k) => satir(k, s++, false, false, k.esikAlti));

  const dolular = slots.filter((x): x is DoluSatir => !x.bos);
  const ozet: Ozet = {
    korunuyor: dolular.filter((x) => x.koken === "mevcut").length,
    ekleniyor: dolular.filter((x) => x.koken === "yeni").length,
    cikiyor: kalanlar.filter((x) => x.koken === "mevcut").length,
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

function bosSlot(sira: number, aday: Aday & { puan: number }, devralan: (Aday & { puan: number }) | undefined, esik: number): BosSatir {
  return {
    bos: true,
    sira,
    gerekce:
      `Sıradaki aday “${aday.ad}” (${aday.puan} puan) kanıt yeterliliği ${aday.kanit}/100 ile ` +
      `${esik} eşiğinin altında; slot dolduramaz. Eşiği geçen ilk aday ` +
      `“${devralan ? devralan.ad : "—"}” ${devralan ? aday.puan - devralan.puan : "—"} puan ` +
      `geride olduğu için devralmadı. Slot boş bırakıldı.`,
  };
}

function satir(
  aday: Aday & { puan: number },
  sira: number,
  ilkDortte: boolean,
  esikDevri: boolean,
  esikAlti: boolean,
): DoluSatir {
  return { ...aday, bos: false, sira, sonuc: sonucEtiketi(aday.koken, ilkDortte, esikAlti), esikDevri, esikAlti };
}

/** Brief §2 sonuç_etiketi — birebir. */
function sonucEtiketi(koken: Koken, ilkDortte: boolean, esikAlti: boolean): Sonuc {
  if (ilkDortte) return koken === "mevcut" ? "korunuyor" : "ekleniyor";
  if (esikAlti) return "koşullu";
  return koken === "mevcut" ? "çıkıyor" : "yedek";
}

/** §1 — uç durumlar işaretlenir ve kuruldan gerekçe ister. */
function ucDurum(ozet: Ozet, slotSayisi: number): UcDurum {
  if (ozet.bosSlot > 0) {
    return {
      baslik:
        ozet.bosSlot === 1
          ? `${slotSayisi} slottan biri boş kalıyor`
          : `${slotSayisi} slottan ${ozet.bosSlot} tanesi boş kalıyor`,
      metin:
        "Boş slot meşru bir sonuçtur, hata değildir. Kurulun yazılı gerekçesi ve bir kanıt talebi " +
        "açması gerekir; slot bir sonraki dönemde yeniden yarışa açılır.",
    };
  }
  if (ozet.korunuyor === slotSayisi) {
    return {
      baslik: `${slotSayisi} konunun tamamı korunuyor`,
      metin: "Yüksek sonuçlu çıktı. Kurulun ayrıca gerekçe yazması ve kamuya açık kayda geçirmesi gerekir.",
    };
  }
  if (ozet.korunuyor === 0 && ozet.cikiyor > 0) {
    return {
      baslik: "mevcut konuların tamamı değişiyor",
      metin: "Yüksek sonuçlu çıktı. Kurulun ayrıca gerekçe yazması ve kamuya açık kayda geçirmesi gerekir.",
    };
  }
  return null;
}

/** İlk dörde giren adayların kimliği — senaryo karşılaştırması için. */
export function slotKimlikleri(h: Hesap): Array<string | null> {
  return h.ilkDort.map((s) => (s.bos ? null : s.id));
}
