"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils.ts";
import { kayitSatiri } from "./kayit-satiri.tsx";
import type { EylemSonucu } from "@/lib/eylem.ts";

/** Sunucu eylemi + hata gösterimi + bildirim. §10: hata ne olduğunu ve nasıl düzeltileceğini söyler. */
export function EylemFormu({
  eylem,
  children,
  className,
  onSonuc,
}: {
  eylem: (o: EylemSonucu | null, f: FormData) => Promise<EylemSonucu>;
  children: ReactNode;
  className?: string;
  onSonuc?: (s: EylemSonucu) => void;
}) {
  const [durum, gonder] = useActionState(eylem, null);

  useEffect(() => {
    if (!durum) return;
    if (durum.ok) kayitSatiri(durum.mesaj);
    onSonuc?.(durum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durum]);

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
  name,
  value,
}: {
  children: ReactNode;
  varyant?: "dolu" | "cizgi" | "amber" | "kirmizi";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  const stil = {
    dolu: "border-ink bg-ink text-paper",
    cizgi: "border-hairline bg-transparent text-ink",
    amber: "border-unverif-line bg-unverif-tint text-[#5F4A15]",
    kirmizi: "border-conflict-line bg-conflict-tint text-conflict",
  }[varyant];

  return (
    <button
      type="submit"
      name={name}
      value={value}
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
