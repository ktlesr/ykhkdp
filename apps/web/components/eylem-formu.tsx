"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils.ts";
import { kayitSatiri } from "./kayit-satiri.tsx";
import type { EylemSonucu } from "@/lib/eylem.ts";

/**
 * Sunucu eylemi + hata gösterimi + kayıt satırı. Tek yerde.
 *
 * §10 — hata "ne olduğunu VE nasıl düzeltileceğini" söyler; ayrı tonlama
 * yapılmaz, conflict rengi + düz kenar kullanılır.
 */

export function EylemFormu({
  eylem,
  children,
  className,
  surum,
}: {
  eylem: (onceki: EylemSonucu | null, form: FormData) => Promise<EylemSonucu>;
  children: ReactNode;
  className?: string;
  surum?: string;
}) {
  const [durum, gonder] = useActionState(eylem, null);

  useEffect(() => {
    if (durum?.ok) kayitSatiri(durum.mesaj, surum);
  }, [durum, surum]);

  return (
    <form action={gonder} className={className}>
      {durum && !durum.ok && (
        <div
          role="alert"
          className="mb-3.5 border border-conflict-line border-l-[3px] border-l-conflict bg-conflict-tint px-3.5 py-3 text-[13px] text-ink-soft"
        >
          {durum.mesaj}
        </div>
      )}
      {children}
    </form>
  );
}

export function Gonder({
  children,
  varyant = "dolu",
  className,
}: {
  children: ReactNode;
  varyant?: "dolu" | "cizgi" | "amber";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const stil = {
    dolu: "border-ink bg-ink text-paper",
    cizgi: "border-hairline bg-transparent text-ink",
    amber: "border-unverif-line bg-transparent text-[#5F4A15]",
  }[varyant];

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "min-h-11 cursor-pointer border px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em]",
        stil,
        pending && "cursor-progress opacity-60",
        className,
      )}
    >
      {pending ? "Kaydediliyor…" : children}
    </button>
  );
}

/** Yazılı doğrulama olmadan pasif kalan onay butonu (§7 OV-02). */
export function OnayliGonder({ hazir, children }: { hazir: boolean; children: ReactNode }) {
  const { pending } = useFormStatus();
  const pasif = !hazir || pending;
  return (
    <button
      type="submit"
      disabled={pasif}
      className={cn(
        "ml-auto min-h-11 border px-[18px] py-[11px] font-mono text-[11px] uppercase tracking-[.1em]",
        pasif
          ? "cursor-not-allowed border-[#D5D1C7] bg-hairline-soft text-[#8E959F]"
          : "cursor-pointer border-ink bg-ink text-paper",
      )}
    >
      {children}
    </button>
  );
}
