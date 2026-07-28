import type { Rol } from "./roller.ts";
import { KARAR_KILITLEYEBILIR } from "./roller.ts";

/**
 * Dönem (cycle) durum makinesi.
 *
 * §1.7 — çalışma alanı ile kilitli karar sürümü asla karışmaz. Kilit sonrası
 * dönem salt okunurdur; değişiklik ancak yeni sürüm açarak yapılır.
 */

export const DONEM_DURUMLARI = ["hazirlik", "oneri_acik", "degerlendirme", "kilitli"] as const;
export type DonemDurumu = (typeof DONEM_DURUMLARI)[number];

export const DONEM_ETIKET: Record<DonemDurumu, string> = {
  hazirlik: "Hazırlık",
  oneri_acik: "Öneriye açık",
  degerlendirme: "Değerlendirme",
  kilitli: "Kilitli · salt okunur",
};

const DONEM_GECIS: Record<DonemDurumu, DonemDurumu[]> = {
  hazirlik: ["oneri_acik"],
  oneri_acik: ["degerlendirme"],
  degerlendirme: ["oneri_acik", "kilitli"],
  kilitli: [],
};

export function donemGecisIzinli(from: DonemDurumu, to: DonemDurumu, rol: Rol): boolean {
  if (!DONEM_GECIS[from].includes(to)) return false;
  if (to === "kilitli") return KARAR_KILITLEYEBILIR.includes(rol);
  return rol === "ajans_uzmani" || rol === "sistem_yoneticisi";
}

export function oneriKabulEdiyor(durum: DonemDurumu): boolean {
  return durum === "oneri_acik";
}

export function saltOkunur(durum: DonemDurumu): boolean {
  return durum === "kilitli";
}

/** §7 — kilit yazılı doğrulama ister. Tek kaynak burada. */
export const KILIT_ONAY_KELIMESI = "KİLİTLE";

export function kilitOnayiGecerli(girilen: string): boolean {
  return girilen.trim().toLocaleUpperCase("tr-TR") === KILIT_ONAY_KELIMESI;
}
