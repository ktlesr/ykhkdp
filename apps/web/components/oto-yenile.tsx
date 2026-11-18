"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Süren iş varken sayfayı kendiliğinden tazeler: aşama rozetleri ve sayaçlar
 * elle yenilemeden ilerler. İş yoksa (`aktif` false) hiçbir şey yapmaz.
 * Sekme görünmüyorken sorgu atılmaz.
 */
export function OtoYenile({ aktif, ms = 4000 }: { aktif: boolean; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!aktif) return;
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), ms);
    return () => clearInterval(t);
  }, [aktif, ms, router]);
  return null;
}
