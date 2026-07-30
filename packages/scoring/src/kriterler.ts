/**
 * Sekiz kriter ve sürümlü ağırlık setleri.
 *
 * Brief §5: kriter setleri ve ağırlıklar GLOBAL SABİT DEĞİL, `(ajans, dönem)`
 * anahtarıyla sürümlü kayıttır. TR33 kalibrasyonu "varsayılan" değil,
 * `TR33-2027-v1` olarak adlandırılır.
 */

export const KRITERLER = [
  "plan_uyumu",
  "yerel_potansiyel",
  "pazar_talep",
  "deger_zinciri",
  "istihdam_katma_deger",
  "uygulanabilirlik",
  "yatirimci_ilgisi",
  "surdurulebilirlik",
] as const;

export type Kriter = (typeof KRITERLER)[number];

export const KRITER_ETIKET: Record<Kriter, string> = {
  plan_uyumu: "Üst ölçekli plan uyumu",
  yerel_potansiyel: "Yerel kaynak, girdi ve hammadde potansiyeli",
  pazar_talep: "Pazar ve talep",
  deger_zinciri: "Mevcut yerel değer zinciri ve ekosistem tamamlayıcılığı",
  istihdam_katma_deger: "İstihdam ve katma değer etkisi",
  uygulanabilirlik: "Yerel uygulanabilirlik — arazi, enerji, altyapı, işgücü",
  yatirimci_ilgisi: "Yatırımcı ilgisi ve gerçekleşme olasılığı",
  surdurulebilirlik: "Çevresel ve sosyal sürdürülebilirlik",
};

/**
 * Kriter grupları.
 *
 * Programın adı Yerel Kalkınma Hamlesi'dir: bir yatırım konusunun asıl
 * gerekçesi "bu konuyu neden BU ilde/ilçede yapıyoruz" sorusunun cevabıdır.
 * `yerellik` grubu bu soruyu cevaplayan üç kriteri toplar ve toplam ağırlığın
 * en büyük payını taşır — bu bir kalibrasyon tercihi değil, ürün kuralıdır.
 */
export const GRUPLAR = ["yerellik", "etki", "gerceklesme", "uyum"] as const;
export type Grup = (typeof GRUPLAR)[number];

export const GRUP_ETIKET: Record<Grup, string> = {
  yerellik: "Neden burada?",
  etki: "Ne üretir?",
  gerceklesme: "Gerçekleşir mi?",
  uyum: "Politikayla uyum",
};

export const GRUP_ACIKLAMA: Record<Grup, string> = {
  yerellik:
    "Konunun bu ile ve ilçeye bağlanma gerekçesi: yerel kaynak ve girdi, mevcut değer zinciri, " +
    "arazi-enerji-altyapı-işgücü donanımı. Aynı konu başka bir ilde yapılabiliyorsa bu grup düşer.",
  etki: "Yatırımın ilde ürettiği istihdam, katma değer ve çevresel-sosyal sonuç.",
  gerceklesme: "Pazarın ve yatırımcı ilgisinin konuyu gerçekten hayata geçirme olasılığı.",
  uyum: "Üst ölçekli plan ve program hedefleriyle uyum.",
};

export const KRITER_GRUBU: Record<Kriter, Grup> = {
  yerel_potansiyel: "yerellik",
  deger_zinciri: "yerellik",
  uygulanabilirlik: "yerellik",
  istihdam_katma_deger: "etki",
  surdurulebilirlik: "etki",
  pazar_talep: "gerceklesme",
  yatirimci_ilgisi: "gerceklesme",
  plan_uyumu: "uyum",
};

/**
 * "Neden burada?" grubunun toplam ağırlıkta taşıması gereken en düşük pay.
 * Hiçbir ajans kalibrasyonu bunun altına inemez; `agirlikSetiGecerli()` reddeder.
 * Sürümlü parametre değil, ürün kuralıdır — bu yüzden ağırlık setinde değil,
 * kriter modelinde durur.
 */
export const YERELLIK_TABANI = 0.4;

export type Agirliklar = Record<Kriter, number>;

export function grupAgirligi(agirliklar: Agirliklar, grup: Grup): number {
  return KRITERLER.filter((k) => KRITER_GRUBU[k] === grup).reduce((t, k) => t + agirliklar[k], 0);
}

export function gruplaraGore(agirliklar: Agirliklar): Array<{ grup: Grup; agirlik: number; kriterler: Kriter[] }> {
  return GRUPLAR.map((grup) => ({
    grup,
    agirlik: grupAgirligi(agirliklar, grup),
    kriterler: KRITERLER.filter((k) => KRITER_GRUBU[k] === grup),
  }));
}

/**
 * Sürümlü ağırlık kaydı. Üretimde `packages/database`'ten gelir; buradaki
 * kayıt yalnızca kalibrasyonun kanonik tanımıdır ve kod içinde sabitlenmiş
 * bir "varsayılan ajans" yoktur — anahtar her zaman (ajans, dönem).
 */
export type AgirlikSeti = {
  surum: string;
  ajans: string;
  donem: string;
  agirliklar: Agirliklar;
  /** §1.4 — gizli katsayı değil; sürümlü ve ilan edilen parametre */
  devamlilikPayi: number;
  /** AI'nin öneriyi üst ölçekli belgelere bağlayabilme eşiği (0–100) */
  dayanakEsigi: number;
  /** eşiği geçen alt aday bu farktan fazla gerideyse slot boş kalır */
  devirSiniri: number;
  slotSayisi: number;
};

export const TR33_2027_V1: AgirlikSeti = {
  surum: "TR33-2027-v1",
  ajans: "TR33",
  donem: "2027",
  agirliklar: {
    // yerellik · %44 — "neden burada?" en büyük pay
    yerel_potansiyel: 0.18,
    deger_zinciri: 0.14,
    uygulanabilirlik: 0.12,
    // etki · %24
    istihdam_katma_deger: 0.16,
    surdurulebilirlik: 0.08,
    // gerçekleşme · %20
    pazar_talep: 0.12,
    yatirimci_ilgisi: 0.08,
    // uyum · %12
    plan_uyumu: 0.12,
  },
  devamlilikPayi: 5,
  dayanakEsigi: 55,
  devirSiniri: 8,
  slotSayisi: 4,
};

/** Ağırlıklar 1'e toplanmalı; toplamazsa puan yorumlanamaz. Fail-closed. */
export function agirlikSetiGecerli(set: AgirlikSeti): { gecerli: boolean; sebep?: string } {
  const eksik = KRITERLER.filter((k) => typeof set.agirliklar[k] !== "number");
  if (eksik.length) return { gecerli: false, sebep: `Eksik kriter ağırlığı: ${eksik.join(", ")}` };
  const negatif = KRITERLER.filter((k) => set.agirliklar[k] < 0);
  if (negatif.length) return { gecerli: false, sebep: `Negatif ağırlık: ${negatif.join(", ")}` };
  const toplam = KRITERLER.reduce((t, k) => t + set.agirliklar[k], 0);
  if (Math.abs(toplam - 1) > 1e-9) {
    return { gecerli: false, sebep: `Ağırlık toplamı 1 değil: ${toplam.toFixed(4)}` };
  }
  if (set.slotSayisi < 1) return { gecerli: false, sebep: "Slot sayısı en az 1 olmalı." };
  if (set.dayanakEsigi < 0 || set.dayanakEsigi > 100) {
    return { gecerli: false, sebep: "Dayanak eşiği 0–100 aralığında olmalı." };
  }

  // Ürün kuralı: "neden burada?" en büyük payı taşır.
  const yerellik = grupAgirligi(set.agirliklar, "yerellik");
  if (yerellik + 1e-9 < YERELLIK_TABANI) {
    return {
      gecerli: false,
      sebep:
        `“Neden burada?” grubunun payı %${(yerellik * 100).toFixed(0)} — taban %${YERELLIK_TABANI * 100}. ` +
        "Yerel Kalkınma Hamlesi'nde bir konunun asıl gerekçesi o ile bağlanma nedenidir; " +
        "bu payın altına inen ağırlık seti kullanılamaz.",
    };
  }
  const enBuyuk = GRUPLAR.map((g) => grupAgirligi(set.agirliklar, g)).reduce((a, b) => Math.max(a, b));
  if (yerellik < enBuyuk) {
    return { gecerli: false, sebep: "“Neden burada?” grubu en büyük ağırlığa sahip olmalı." };
  }
  return { gecerli: true };
}
