"use client";

import { Toaster, toast } from "sonner";

/**
 * Kayıt bildirimi — bir işlemin deftere geçtiğini söyler, kritik bilgi taşımaz
 * (hata formun içinde kalır). Sol alt, sessiz: yeşil kenar + ■ "kayda geçti".
 */
export function KayitSatiriAlani() {
  return <Toaster position="bottom-left" offset={24} toastOptions={{ unstyled: true }} />;
}

export function kayitSatiri(mesaj: string): void {
  const saat = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  toast.custom(() => (
    <div
      role="status"
      className="flex w-[420px] max-w-[calc(100vw-48px)] animate-ledger-in items-start gap-3 border border-hairline border-l-[3px] border-l-verified bg-surface px-4 py-3.5"
    >
      <span className="num mt-[3px] text-[11px] text-verified" aria-hidden>
        ■
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13.5px] font-semibold text-ink">Kayda geçti</span>
          <span className="num text-[11.5px] text-ink-mute">{saat}</span>
        </div>
        <div className="mt-0.5 text-[13.5px] leading-[1.5] text-ink-soft">{mesaj}</div>
      </div>
    </div>
  ));
}
