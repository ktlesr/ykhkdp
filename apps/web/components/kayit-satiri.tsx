"use client";

import { Toaster, toast } from "sonner";

/**
 * OV-03 · Kayıt satırı. Toast değil, defter satırı: koyu, kare, sol kenar 3px
 * onay yeşili, sol altta. Asla kritik bilgi taşımaz.
 */

export function KayitSatiriAlani({ surum }: { surum: string }) {
  return (
    <Toaster
      position="bottom-left"
      offset={28}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-[420px] max-w-[calc(100vw-56px)] border border-black border-l-[3px] border-l-verified " +
            "bg-ink text-[#EDE9E0] p-4 animate-ledger-in",
          title: "text-[13.5px] leading-[1.45]",
        },
      }}
      icons={{ success: null, error: null, info: null, warning: null, loading: null }}
      // Sürüm damgası her satırda görünür (§7).
      expand
      data-surum={surum}
    />
  );
}

export function kayitSatiri(mesaj: string, surum?: string): void {
  const saat = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  toast.custom(() => (
    <div className="flex w-[420px] max-w-[calc(100vw-56px)] animate-ledger-in gap-3 border border-black border-l-[3px] border-l-verified bg-ink p-4 text-[#EDE9E0]">
      <span className="font-mono text-[12px] leading-[1.3] text-[#6FBFA3]" aria-hidden>
        ■
      </span>
      <div className="flex-1">
        <div className="font-mono text-[9.5px] uppercase tracking-[.14em] text-[#8E959F]">
          Kayıt satırı · {saat.replace(",", " ·")}
        </div>
        <div className="mt-1.5 text-[13.5px] leading-[1.45]">{mesaj}</div>
        {surum && <div className="mt-1.5 font-mono text-[10px] text-[#8E959F]">Sürüm {surum}</div>}
      </div>
    </div>
  ));
}
