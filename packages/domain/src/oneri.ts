import type { Rol } from "./roller.ts";

/**
 * Öneri durum makinesi.
 *
 * Brief §4: süreç durumundan `INSTITUTION_REVIEW` ÇIKARILMIŞTIR — kurum onayı yok.
 * Bir öneri kurum değil, birey tarafından verilir ve doğrudan triyaja düşer.
 */

export const ONERI_DURUMLARI = [
  "taslak",
  "kanit_bekliyor",
  "triyaj",
  "uzman_incelemesinde",
  "revizyon_istendi",
  "konu_adayi",
  "birlestirildi",
  "reddedildi",
] as const;

export type OneriDurumu = (typeof ONERI_DURUMLARI)[number];

export const ONERI_DURUM_ETIKET: Record<OneriDurumu, string> = {
  taslak: "Taslak",
  kanit_bekliyor: "Kanıt bekliyor",
  triyaj: "Triyajda",
  uzman_incelemesinde: "Uzman incelemesinde",
  revizyon_istendi: "Revizyon istendi",
  konu_adayi: "Konu adayı",
  birlestirildi: "Başka dosyayla birleştirildi",
  reddedildi: "Reddedildi",
};

export type Gecis = {
  from: OneriDurumu;
  to: OneriDurumu;
  /** geçişi tetikleyebilen roller */
  roller: readonly Rol[];
  /** kullanıcı arayüzünde butonun yazdığı fiil (§1.9 — ne yapıyorsa onu yazar) */
  eylem: string;
  /** gerekçe metni zorunlu mu */
  gerekceZorunlu?: boolean;
};

/** Sahibi (öneriyi veren birey) kendi dosyasında tetikleyebileceği geçişler. */
const SAHIP: readonly Rol[] = ["birey"];
const UZMAN: readonly Rol[] = ["ajans_uzmani", "sektor_uzmani"];

export const GECISLER: readonly Gecis[] = [
  { from: "taslak", to: "kanit_bekliyor", roller: SAHIP, eylem: "Öneriyi gönder" },
  { from: "kanit_bekliyor", to: "triyaj", roller: UZMAN, eylem: "Triyaja al" },
  { from: "kanit_bekliyor", to: "birlestirildi", roller: [...SAHIP, ...UZMAN], eylem: "Mevcut dosyayla birleştir", gerekceZorunlu: true },
  { from: "triyaj", to: "uzman_incelemesinde", roller: UZMAN, eylem: "İncelemeye al" },
  { from: "triyaj", to: "birlestirildi", roller: UZMAN, eylem: "Mevcut dosyayla birleştir", gerekceZorunlu: true },
  { from: "triyaj", to: "reddedildi", roller: UZMAN, eylem: "Reddet", gerekceZorunlu: true },
  { from: "uzman_incelemesinde", to: "revizyon_istendi", roller: UZMAN, eylem: "Revizyon iste", gerekceZorunlu: true },
  { from: "uzman_incelemesinde", to: "konu_adayi", roller: UZMAN, eylem: "Konu adayı olarak kabul et", gerekceZorunlu: true },
  { from: "uzman_incelemesinde", to: "reddedildi", roller: UZMAN, eylem: "Reddet", gerekceZorunlu: true },
  { from: "revizyon_istendi", to: "uzman_incelemesinde", roller: SAHIP, eylem: "Revizyonu gönder" },
  { from: "konu_adayi", to: "uzman_incelemesinde", roller: UZMAN, eylem: "Yeniden incelemeye aç", gerekceZorunlu: true },
];

/** Nihai durumlar — buradan çıkış yok. */
export const SON_DURUMLAR: readonly OneriDurumu[] = ["birlestirildi", "reddedildi"];

export function gecisBul(from: OneriDurumu, to: OneriDurumu): Gecis | undefined {
  return GECISLER.find((g) => g.from === from && g.to === to);
}

export type GecisSonuc = { izinli: true; gecis: Gecis } | { izinli: false; sebep: string };

/**
 * Fail-closed: tanımlı olmayan her geçiş reddedilir.
 * `sahipMi` yalnızca `birey` rolü için anlamlıdır — birey ancak kendi dosyasını yürütür.
 */
export function gecisIzinli(
  from: OneriDurumu,
  to: OneriDurumu,
  rol: Rol,
  sahipMi: boolean,
): GecisSonuc {
  if (from === to) return { izinli: false, sebep: "Aynı duruma geçiş yok." };
  if (SON_DURUMLAR.includes(from)) {
    return { izinli: false, sebep: `“${ONERI_DURUM_ETIKET[from]}” nihai durumdur; geçiş yapılamaz.` };
  }
  const gecis = gecisBul(from, to);
  if (!gecis) {
    return { izinli: false, sebep: `${ONERI_DURUM_ETIKET[from]} → ${ONERI_DURUM_ETIKET[to]} geçişi tanımlı değil.` };
  }
  if (!gecis.roller.includes(rol)) {
    return { izinli: false, sebep: `Bu geçişi ${rol} rolü tetikleyemez.` };
  }
  if (rol === "birey" && !sahipMi) {
    return { izinli: false, sebep: "Birey yalnızca kendi önerisini yürütebilir." };
  }
  return { izinli: true, gecis };
}

/** Bir rolün, verili durumdan tetikleyebileceği geçişler (UI buton listesi). */
export function olasiGecisler(from: OneriDurumu, rol: Rol, sahipMi: boolean): Gecis[] {
  return GECISLER.filter((g) => g.from === from && gecisIzinli(from, g.to, rol, sahipMi).izinli);
}

/** Yalnızca `konu_adayi` durumundaki öneriler sıralamaya girer. */
export function siralamayaGirer(durum: OneriDurumu): boolean {
  return durum === "konu_adayi";
}
