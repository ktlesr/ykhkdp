"use client";

import { cn } from "@/lib/utils.ts";
import { DUGME_STIL, DUGME_TABAN } from "./ui.tsx";
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
    return <span className="etiket text-ink-mute">{hata}</span>;
  }

  if (!emin) {
    return (
      <button
        type="button"
        onClick={() => setEmin(true)}
        className="min-h-11 cursor-pointer border border-hairline bg-paper px-[11px] py-[7px] etiket text-ink-mute"
      >
        Sil
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="etiket text-ink-mute">
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
        className={cn(DUGME_TABAN, DUGME_STIL.kirmizi)}
      >
        {bekliyor ? "Siliniyor" : "Onayla"}
      </button>
      <button
        type="button"
        onClick={() => setEmin(false)}
        className="min-h-11 cursor-pointer border border-hairline bg-paper px-[11px] py-[7px] etiket text-ink-mute"
      >
        Vazgeç
      </button>
    </span>
  );
}
