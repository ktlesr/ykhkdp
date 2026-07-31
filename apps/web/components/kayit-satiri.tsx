"use client";

import { Toaster, toast } from "sonner";

/** Bildirim: koyu, kare, sol kenar onay yeşili, sol altta. Kritik bilgi taşımaz. */
export function KayitSatiriAlani() {
  return <Toaster position="bottom-left" offset={24} toastOptions={{ unstyled: true }} />;
}

export function kayitSatiri(mesaj: string): void {
  const saat = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  toast.custom(() => (
    <div className="panel-koyu flex w-[400px] max-w-[calc(100vw-48px)] animate-ledger-in gap-3 border border-[#000] border-l-[3px] border-l-verified p-4">
      <span className="font-mono text-[12px] leading-[1.3] text-[#6FBFA3]" aria-hidden>
        ■
      </span>
      <div className="flex-1">
        <div className="font-mono text-[9.5px] uppercase tracking-[.14em] text-[#8E959F]">Kayıt · {saat}</div>
        <div className="mt-1.5 text-[13.5px] leading-[1.45]">{mesaj}</div>
      </div>
    </div>
  ));
}
