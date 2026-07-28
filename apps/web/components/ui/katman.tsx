"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

/**
 * §7 — bu üründe "modal" yok; üç katman tipi var. Hepsi kare köşeli, gölgesiz,
 * künye/sürüm damgası taşır. Radix odak tuzağını, `aria-modal`'ı ve Escape'i
 * verir; görünüm tamamen bizim.
 *
 * ponytail: shadcn Sheet + Dialog iki ayrı dosya; ikisi de aynı Radix Dialog
 * primitifi. Tek dosyada iki bileşen yeterli.
 */

const PERDE = "fixed inset-0 z-50 animate-veil-in";

/** OV-01 · Künye çekmecesi — okuma amaçlı, sayfa bağlamı görünür kalır. */
export function Cekmece({
  acik,
  kapat,
  baslik,
  kod,
  children,
  altBar,
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  kod: string;
  children: ReactNode;
  altBar?: ReactNode;
}) {
  return (
    <Dialog.Root open={acik} onOpenChange={(o) => !o && kapat()}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(PERDE, "bg-[rgba(16,20,25,.42)]")} />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-[520px] max-w-[92vw] animate-drawer-in flex-col overflow-auto border-l border-l-ink bg-surface shadow-none outline-none"
          aria-describedby={undefined}
        >
          <div className="border-b-2 border-b-ink bg-paper px-[22px] py-[18px]">
            <div className="flex items-center justify-between gap-3.5">
              <span className="font-mono text-[10px] uppercase tracking-[.14em] text-ink-mute">
                Kanıt künyesi · {kod}
              </span>
              <Dialog.Close className="cursor-pointer border border-hairline px-[9px] py-[5px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink">
                Kapat · esc
              </Dialog.Close>
            </div>
            <Dialog.Title className="mt-2 font-display text-[23px] leading-[1.2]">{baslik}</Dialog.Title>
          </div>
          <div className="flex-1">{children}</div>
          {altBar && <div className="mt-auto border-t-2 border-t-ink bg-[#FDFCFA] px-[22px] py-4">{altBar}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * OV-02 · Karar tabakası — yalnızca geri alınamaz işlemler.
 * Varsayılan odak Vazgeç'tedir; onay butonu görsel olarak avantajlı değildir.
 */
export function KararTabakasi({
  acik,
  kapat,
  ustEtiket,
  baslik,
  kunye,
  children,
  altBar,
  genislik = 720,
}: {
  acik: boolean;
  kapat: () => void;
  ustEtiket: string;
  baslik: string;
  kunye?: ReactNode;
  children: ReactNode;
  altBar: ReactNode;
  genislik?: number;
}) {
  return (
    <Dialog.Root open={acik} onOpenChange={(o) => !o && kapat()}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(PERDE, "bg-[rgba(16,20,25,.62)]")} />
        <Dialog.Content
          style={{ width: genislik }}
          className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-64px)] max-w-[calc(100vw-64px)] -translate-x-1/2 -translate-y-1/2 animate-sheet-in overflow-auto border border-ink border-t-[6px] border-t-ink bg-[#FDFCFA] shadow-none outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between gap-5 border-b border-b-hairline-soft px-[26px] pt-[22px] pb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[.15em] text-ink-mute">{ustEtiket}</div>
              <Dialog.Title className="mt-2 font-display text-[29px] leading-[1.14]">{baslik}</Dialog.Title>
            </div>
            {kunye}
          </div>
          <div className="px-[26px] pt-[18px] pb-1.5">{children}</div>
          <div className="mt-3.5 flex items-center gap-3 border-t-2 border-t-ink bg-paper px-[26px] py-[18px]">
            {altBar}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Blok 3 gönderim anındaki benzerlik katmanı — alt ortada, amber üst kenar. */
export function BenzerlikKatmani({
  acik,
  kapat,
  children,
}: {
  acik: boolean;
  kapat: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={acik} onOpenChange={(o) => !o && kapat()}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(PERDE, "bg-[rgba(16,20,25,.55)]")} />
        <Dialog.Content
          className="fixed bottom-0 left-1/2 z-50 max-h-[92vh] w-[440px] max-w-full -translate-x-1/2 animate-sheet-in overflow-auto border border-ink border-t-[5px] border-t-unverif bg-[#FDFCFA] shadow-none outline-none"
          aria-describedby={undefined}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const KatmanBaslik = Dialog.Title;
export const KatmanKapat = Dialog.Close;
