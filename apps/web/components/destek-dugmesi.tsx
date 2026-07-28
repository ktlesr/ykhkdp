"use client";

import { useTransition } from "react";
import { destekEylemi } from "@/lib/eylem.ts";
import { kayitSatiri } from "./kayit-satiri.tsx";

/** §1.6 — destek bir ilgi sinyali. Butonun dili oy verme çağrıştırmaz. */
export function DestekDugmesi({ oneriId, yol }: { oneriId: number; yol: string }) {
  const [bekliyor, gecis] = useTransition();

  return (
    <button
      type="button"
      disabled={bekliyor}
      onClick={() =>
        gecis(async () => {
          const r = await destekEylemi(oneriId, yol);
          kayitSatiri(r.mesaj);
        })
      }
      className="mt-3 min-h-11 w-full cursor-pointer border border-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink disabled:cursor-progress disabled:opacity-60"
    >
      {bekliyor ? "Kaydediliyor…" : "Bu dosyayı destekliyorum"}
    </button>
  );
}
