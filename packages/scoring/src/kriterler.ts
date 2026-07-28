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
  yerel_potansiyel: "Yerel kaynak ve girdi potansiyeli",
  pazar_talep: "Pazar ve talep",
  deger_zinciri: "Değer zinciri ve ekosistem tamamlayıcılığı",
  istihdam_katma_deger: "İstihdam ve katma değer etkisi",
  uygulanabilirlik: "Uygulanabilirlik — arazi, enerji, altyapı, işgücü",
  yatirimci_ilgisi: "Yatırımcı ilgisi ve gerçekleşme olasılığı",
  surdurulebilirlik: "Çevresel ve sosyal sürdürülebilirlik",
};

export type Agirliklar = Record<Kriter, number>;

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
  kanitEsigi: number;
  /** eşiği geçen alt aday bu farktan fazla gerideyse slot boş kalır */
  devirSiniri: number;
  slotSayisi: number;
};

export const TR33_2027_V1: AgirlikSeti = {
  surum: "TR33-2027-v1",
  ajans: "TR33",
  donem: "2027",
  agirliklar: {
    plan_uyumu: 0.16,
    yerel_potansiyel: 0.16,
    pazar_talep: 0.14,
    deger_zinciri: 0.12,
    istihdam_katma_deger: 0.12,
    uygulanabilirlik: 0.12,
    yatirimci_ilgisi: 0.1,
    surdurulebilirlik: 0.08,
  },
  devamlilikPayi: 5,
  kanitEsigi: 55,
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
  if (set.kanitEsigi < 0 || set.kanitEsigi > 100) {
    return { gecerli: false, sebep: "Kanıt eşiği 0–100 aralığında olmalı." };
  }
  return { gecerli: true };
}
