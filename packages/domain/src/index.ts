/**
 * @ykh/domain — roller, öneri durum makinesi, karar modeli tipleri.
 *
 * Saf: DB yok, UI yok, IO yok, tarih/rastgelelik yok.
 */

// ── roller ─────────────────────────────────────────────────────────────────

export const ROLLER = ["yatirimci", "ajans", "yonetici"] as const;
export type Rol = (typeof ROLLER)[number];

export const ROL_ETIKET: Record<Rol, string> = {
  yatirimci: "Yatırımcı",
  ajans: "Ajans",
  yonetici: "Yönetici",
};

/** AI puanını onaylayıp listeye sokabilen roller. Tek geçit. */
export function onaylayabilir(rol: Rol): boolean {
  return rol === "ajans" || rol === "yonetici";
}

/** Üst ölçekli belge yükleyebilen roller. */
export function belgeYukleyebilir(rol: Rol): boolean {
  return rol === "ajans" || rol === "yonetici";
}

// ── erişim sınıfı ──────────────────────────────────────────────────────────

export const ERISIM_SINIFLARI = ["kamuya_acik", "kurum_ici", "gizli"] as const;
export type ErisimSinifi = (typeof ERISIM_SINIFLARI)[number];

const GORUS: Record<Rol | "anonim", ErisimSinifi[]> = {
  anonim: ["kamuya_acik"],
  yatirimci: ["kamuya_acik"],
  ajans: ["kamuya_acik", "kurum_ici"],
  yonetici: ["kamuya_acik", "kurum_ici", "gizli"],
};

export function gorebilir(rol: Rol | "anonim", sinif: ErisimSinifi): boolean {
  return GORUS[rol].includes(sinif);
}

// ── öneri durum makinesi ───────────────────────────────────────────────────

export const ONERI_DURUMLARI = ["degerlendiriliyor", "onay_bekliyor", "listede", "reddedildi"] as const;
export type OneriDurumu = (typeof ONERI_DURUMLARI)[number];

export const ONERI_DURUM_ETIKET: Record<OneriDurumu, string> = {
  degerlendiriliyor: "Değerlendiriliyor",
  onay_bekliyor: "Ajans onayı bekliyor",
  listede: "Listede",
  reddedildi: "Reddedildi",
};

export const ONERI_DURUM_ACIKLAMA: Record<OneriDurumu, string> = {
  degerlendiriliyor: "Yapay zekâ öneriyi üst ölçekli belgelere ve sekiz kritere göre puanlıyor.",
  onay_bekliyor: "Puan hazır ama doğrulanmadı. Ajans onaylamadan sıralamaya girmez.",
  listede: "Ajans onayladı; öneri il sıralamasında yer alıyor.",
  reddedildi: "Ajans reddetti. Gerekçe önerinin sayfasında görünür.",
};

type Gecis = { from: OneriDurumu; to: OneriDurumu; roller: readonly Rol[]; eylem: string; gerekceZorunlu: boolean };

const ONAYLAYAN: readonly Rol[] = ["ajans", "yonetici"];

export const GECISLER: readonly Gecis[] = [
  { from: "degerlendiriliyor", to: "onay_bekliyor", roller: ONAYLAYAN, eylem: "Puanı hazır say", gerekceZorunlu: false },
  { from: "onay_bekliyor", to: "listede", roller: ONAYLAYAN, eylem: "Onayla ve listeye al", gerekceZorunlu: false },
  { from: "onay_bekliyor", to: "reddedildi", roller: ONAYLAYAN, eylem: "Reddet", gerekceZorunlu: true },
  { from: "listede", to: "onay_bekliyor", roller: ONAYLAYAN, eylem: "Onayı geri al", gerekceZorunlu: true },
  { from: "reddedildi", to: "onay_bekliyor", roller: ONAYLAYAN, eylem: "Yeniden değerlendir", gerekceZorunlu: true },
];

export type GecisSonuc = { izinli: true; gecis: Gecis } | { izinli: false; sebep: string };

/** Fail-closed: tanımlı olmayan her geçiş reddedilir. */
export function gecisIzinli(from: OneriDurumu, to: OneriDurumu, rol: Rol): GecisSonuc {
  const gecis = GECISLER.find((g) => g.from === from && g.to === to);
  if (!gecis) {
    return { izinli: false, sebep: `${ONERI_DURUM_ETIKET[from]} → ${ONERI_DURUM_ETIKET[to]} geçişi tanımlı değil.` };
  }
  if (!gecis.roller.includes(rol)) {
    return { izinli: false, sebep: `Bu geçişi ${ROL_ETIKET[rol]} rolü tetikleyemez.` };
  }
  return { izinli: true, gecis };
}

export function olasiGecisler(from: OneriDurumu, rol: Rol): Gecis[] {
  return GECISLER.filter((g) => g.from === from && gecisIzinli(from, g.to, rol).izinli);
}

/** Yalnızca onaylanmış öneriler sıralamaya girer. */
export function siralamayaGirer(durum: OneriDurumu): boolean {
  return durum === "listede";
}

// ── NACE kaynağı ───────────────────────────────────────────────────────────

export const NACE_KAYNAKLARI = ["kullanici", "ai", "ajans"] as const;
export type NaceKaynagi = (typeof NACE_KAYNAKLARI)[number];

export const NACE_KAYNAK_ETIKET: Record<NaceKaynagi, string> = {
  kullanici: "Yatırımcı girdi",
  ai: "AI atadı · doğrulanmadı",
  ajans: "Ajans düzeltti",
};

// ── karar modeli ───────────────────────────────────────────────────────────

export type Koken = "mevcut" | "yeni";
export type Sonuc = "korunuyor" | "ekleniyor" | "çıkıyor" | "yedek" | "dayanaksız";

/**
 * Sıralamaya giren aday.
 *
 * `dayanak` = AI'nin öneriyi üst ölçekli belgelere bağlayabilme derecesi (0–100).
 * Eşiğin altındaki aday, puanı yüksek olsa da slot dolduramaz — kaynağı belirsiz
 * bir sayı dört konuyu seçemez.
 */
export type Aday = {
  id: string;
  ad: string;
  koken: Koken;
  /** sekiz kriterin ağırlıklı toplamı, devamlılık payı DAHİL DEĞİL */
  taban: number;
  dayanak: number;
  nace: string | null;
};

export type DoluSatir = Aday & {
  bos: false;
  sira: number;
  puan: number;
  sonuc: Sonuc;
  esikDevri: boolean;
  dayanaksiz: boolean;
};

export type BosSatir = { bos: true; sira: number; gerekce: string };
export type Satir = DoluSatir | BosSatir;

export type Ozet = { korunuyor: number; ekleniyor: number; cikiyor: number; bosSlot: number };
export type UcDurum = { baslik: string; metin: string } | null;

export type Hesap = {
  ilkDort: Satir[];
  kalanlar: DoluSatir[];
  ozet: Ozet;
  fark: number | null;
  saglamlik: number;
  ucDurum: UcDurum;
  pay: number;
  esik: number;
  agirlikSurumu: string;
};

/**
 * Karşı görüş türleri — AI'nin aynı belgelerle ürettiği itirazın sınıfı.
 *
 * Serbest metin yerine tipli itiraz: ajans "hangi tür itiraz" sorusunu bir
 * paragrafı okumadan görür. Liste ürün kararıdır, model dışına çıkamaz.
 */
export const KARSI_GORUS_TURLERI = [
  "baska_yerde_tanimli",
  "farkli_oncelik",
  "belgede_risk",
  "belgede_yok",
] as const;

export type KarsiGorusTuru = (typeof KARSI_GORUS_TURLERI)[number];

export const KARSI_GORUS_ETIKET: Record<KarsiGorusTuru, string> = {
  baska_yerde_tanimli: "Belge bunu başka yer için tanımlıyor",
  farkli_oncelik: "Belge farklı bir önceliği öne çıkarıyor",
  belgede_risk: "Belge bu konuda risk sayıyor",
  belgede_yok: "Belge bu konuya değinmiyor",
};
