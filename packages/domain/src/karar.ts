import type { EpistemikDurum } from "./kanit.ts";

/**
 * Karar modeli tipleri — brief §2. Algoritma @ykh/scoring'de; burada yalnızca
 * paylaşılan tip sözleşmesi durur (iki ajanın birleşme noktası, brief §9).
 */

export type Koken = "mevcut" | "yeni";

export type Sonuc = "korunuyor" | "ekleniyor" | "koşullu" | "çıkıyor" | "yedek";

export const SONUC_ETIKET: Record<Sonuc, string> = {
  korunuyor: "korunuyor",
  ekleniyor: "ekleniyor",
  koşullu: "koşullu",
  çıkıyor: "çıkıyor",
  yedek: "yedek",
};

/** Sıralamaya giren aday. `taban` kriter puanlarından türetilir, pay dahil DEĞİL. */
export type Aday = {
  id: string;
  ad: string;
  koken: Koken;
  taban: number;
  /** kanıt yeterliliği 0–100 — yalnızca uzman onaylı kanıttan */
  kanit: number;
  nace: string;
  ep: EpistemikDurum;
};

export type DoluSatir = Aday & {
  bos: false;
  sira: number;
  puan: number;
  sonuc: Sonuc;
  esikDevri: boolean;
  esikAlti: boolean;
};

export type BosSatir = {
  bos: true;
  sira: number;
  gerekce: string;
};

export type Satir = DoluSatir | BosSatir;

export type Ozet = {
  korunuyor: number;
  ekleniyor: number;
  cikiyor: number;
  bosSlot: number;
};

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
  /** §1.4 — devamlılık payının geldiği sürümlü kayıt; çıktıda açıkça yazar */
  agirlikSurumu: string;
};

/** Dönem kararı kilitlendiğinde dondurulan kayıt. */
export type KilitliKarar = {
  surum: string;
  slotlar: Array<{ sira: number; adayId: string | null; ad: string; sonuc: Sonuc | "boş" }>;
  gerekceler: Array<{ konu: string; gerekce: string }>;
  pay: number;
  esik: number;
};
