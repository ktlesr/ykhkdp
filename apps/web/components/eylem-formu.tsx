"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils.ts";
import { kayitSatiri } from "./kayit-satiri.tsx";
import { DUGME_STIL, DUGME_TABAN, Uyari } from "./ui.tsx";
import type { EylemSonucu } from "@/lib/eylem.ts";

/**
 * Sunucu eylemi + hata gösterimi + bildirim.
 *
 * Hata formun İÇİNDE kalır (toast'ta kaybolmaz): ne olduğunu söyler, düzeltme
 * yolu mesajın kendisindedir. Başarı ise kayıt bildirimi olarak düşer.
 */
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
        <Uyari tur="kirmizi" baslik="İşlem tamamlanmadı" className="mt-0 mb-4">
          {durum.mesaj}
        </Uyari>
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
  bekleme = "Kaydediliyor",
}: {
  children: ReactNode;
  varyant?: keyof typeof DUGME_STIL;
  className?: string;
  name?: string;
  value?: string;
  /** gönderim sürerken düğmede yazan fiil */
  bekleme?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={cn(DUGME_TABAN, DUGME_STIL[varyant], pending && "cursor-progress disabled:opacity-80", className)}
    >
      {pending ? (
        <>
          <span className="analiz-bekle inline-flex items-center" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          {bekleme}
        </>
      ) : (
        children
      )}
    </button>
  );
}
