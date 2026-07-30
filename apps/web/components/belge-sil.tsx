"use client";

import { useState, useTransition } from "react";
import { belgeSilEylemi } from "@/lib/eylem.ts";

/**
 * Belge silme. Bir belge 200'ü aşkın parça olabildiği için silme belge adına
 * göre çalışır ve geri alınamaz — bu yüzden iki adımlı onay var.
 */
export function BelgeSil({ ad, parca }: { ad: string; parca: number }) {
  const [emin, setEmin] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, basla] = useTransition();

  if (hata) {
    return <span className="font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">{hata}</span>;
  }

  if (!emin) {
    return (
      <button
        type="button"
        onClick={() => setEmin(true)}
        className="min-h-11 cursor-pointer border border-hairline bg-paper px-[11px] py-[7px] font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute"
      >
        Sil
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
        {parca} parça silinecek
      </span>
      <button
        type="button"
        disabled={bekliyor}
        onClick={() =>
          basla(async () => {
            const s = await belgeSilEylemi(ad);
            if (!s.ok) setHata(s.mesaj);
          })
        }
        className="min-h-11 cursor-pointer border border-ink bg-ink px-[11px] py-[7px] font-mono text-[10px] uppercase tracking-[.1em] text-paper disabled:opacity-50"
      >
        {bekliyor ? "Siliniyor" : "Onayla"}
      </button>
      <button
        type="button"
        onClick={() => setEmin(false)}
        className="min-h-11 cursor-pointer border border-hairline bg-paper px-[11px] py-[7px] font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute"
      >
        Vazgeç
      </button>
    </span>
  );
}
