import type { DonemKaydi } from "@ykh/database";
import type { Aday } from "@ykh/domain";
import { ayardan, hesapla } from "@ykh/scoring";

export type Konum = { sira: number; tur: "asıl" | "yedek" | "liste dışı" | "dayanaksız" };

/**
 * "Onaylanırsa nereye girer" — onay bekleyen öneri için öngörü.
 *
 * Karar modelinin KENDİSİYLE hesaplanır (`hesapla`): onaylı konular ve
 * bekleyenler birlikte, aynı ağırlık seti, devamlılık payı, dayanak eşiği ve
 * asıl + yedek sınırı. Ayrı bir sıralama formülü yok — iki hesap iki doğru
 * demek olurdu. Bu bir öngörüdür, karar değil: gerçek sıralama onayla oluşur.
 */
export function onaylanirsa(onayli: readonly Aday[], bekleyen: readonly Aday[], d: DonemKaydi): Map<string, Konum> {
  const h = hesapla([...onayli, ...bekleyen], ayardan(d.set));
  const sonuc = new Map<string, Konum>();
  for (const s of h.ilkDort) if (!s.bos) sonuc.set(s.id, { sira: s.sira, tur: "asıl" });
  for (const s of h.kalanlar) {
    sonuc.set(s.id, { sira: s.sira, tur: s.yedekte ? "yedek" : s.dayanaksiz ? "dayanaksız" : "liste dışı" });
  }
  const bekleyenIdleri = new Set(bekleyen.map((x) => x.id));
  return new Map([...sonuc].filter(([id]) => bekleyenIdleri.has(id)));
}

/** Bekleyenleri öngörülen sıraya dizer; konumu olmayan (puanı yok) sona. */
export function konumaGore<T extends { id: number | string }>(satirlar: readonly T[], konum: Map<string, Konum>): T[] {
  return [...satirlar].sort((a, b) => (konum.get(String(a.id))?.sira ?? 999) - (konum.get(String(b.id))?.sira ?? 999));
}
