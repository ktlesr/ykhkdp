"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sayfayı kendiliğinden tazeler: aşama rozetleri ve sayaçlar elle yenilemeden
 * ilerler. Süren iş varken (`aktif`) sık, yokken seyrek (`bostaMs`) — iş
 * sayfa açıldıktan SONRA da başlayabilir (işleyici kuyruktan alır, başka biri
 * keşif başlatır); yalnızca "aktifse tazele" kuralı o başlangıcı kaçırıyordu.
 * Sekme görünmüyorken sorgu atılmaz; sekmeye dönülünce hemen tazelenir.
 */
export function OtoYenile({ aktif, ms = 4000, bostaMs = 15000 }: { aktif: boolean; ms?: number; bostaMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tazele = () => document.visibilityState === "visible" && router.refresh();
    const t = setInterval(tazele, aktif ? ms : bostaMs);
    document.addEventListener("visibilitychange", tazele);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tazele);
    };
  }, [aktif, ms, bostaMs, router]);
  return null;
}
