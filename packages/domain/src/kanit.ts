import type { Rol } from "./roller.ts";
import { KANIT_DOGRULAYABILIR } from "./roller.ts";

/**
 * Kanıt doğrulama durumu ve epistemik gramer (tasarım README §4).
 *
 * §1.3 — puanlamaya YALNIZCA uzman onaylı kanıt girer. AI bulgusu ekranda
 * görünür ama puana katılmaz. Bu dosya o kuralın tek kaynağıdır.
 */

export const DOGRULAMA_DURUMLARI = [
  "beyan",
  "ai_bulgusu",
  "uzman_onayli",
  "reddedildi",
  "celiskili",
] as const;

export type DogrulamaDurumu = (typeof DOGRULAMA_DURUMLARI)[number];

export const DOGRULAMA_ETIKET: Record<DogrulamaDurumu, string> = {
  beyan: "Beyan · doğrulanmadı",
  ai_bulgusu: "AI bulgusu · doğrulanmadı",
  uzman_onayli: "Uzman onaylı kanıt",
  reddedildi: "Reddedildi",
  celiskili: "Çelişen kanıt",
};

/** Üç epistemik durum — tasarım README §4. Renk tek başına taşıyıcı değildir. */
export type EpistemikDurum = "onay" | "ai" | "yok";

export function epistemik(durum: DogrulamaDurumu): EpistemikDurum {
  if (durum === "uzman_onayli") return "onay";
  if (durum === "beyan" || durum === "ai_bulgusu" || durum === "celiskili") return "ai";
  return "yok";
}

/** §1.3 — tek geçit. Puanlama girdisi olup olmadığını yalnızca bu fonksiyon söyler. */
export function puanlamayaGirer(durum: DogrulamaDurumu): boolean {
  return durum === "uzman_onayli";
}

export function dogrulayabilir(rol: Rol): boolean {
  return KANIT_DOGRULAYABILIR.includes(rol);
}

/**
 * Kanıt yeterliliği: yalnızca uzman onaylı kanıtların katkı toplamı, 0–100'e kırpılır.
 * AI bulgusu ve beyan katkı vermez — sıfır ağırlıkla değil, hiç girmeyerek.
 */
export type KanitKatkisi = { agirlik: number; durum: DogrulamaDurumu };

export function kanitYeterliligi(kanitlar: readonly KanitKatkisi[]): number {
  const toplam = kanitlar
    .filter((k) => puanlamayaGirer(k.durum))
    .reduce((t, k) => t + k.agirlik, 0);
  return Math.max(0, Math.min(100, Math.round(toplam)));
}

/** Ekranda gösterilen "ham" yeterlilik: doğrulanmamışlar dahil edilseydi ne olurdu. */
export function kanitPotansiyeli(kanitlar: readonly KanitKatkisi[]): number {
  const toplam = kanitlar
    .filter((k) => k.durum !== "reddedildi")
    .reduce((t, k) => t + k.agirlik, 0);
  return Math.max(0, Math.min(100, Math.round(toplam)));
}
