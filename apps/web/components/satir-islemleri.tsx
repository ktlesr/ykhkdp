"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { oneriSilEylemi } from "@/lib/eylem.ts";

/**
 * Onay kuyruğu satır işlemleri — yalnızca yönetici.
 *
 * Silme iki adımlı: "Sil" yalnızca onay alanını açar; kalıcı silme gerekçe
 * ister ve ayrı bir düğmeyle yapılır. Tek tıkla geri dönüşü olmayan işlem yok.
 * Düzeltme kayıt ekranında yapılır: orada metnin tamamı ve AI'nin dayanağı
 * görünür; metin değişince öneri yeniden değerlendirilir.
 */
export function SatirIslemleri({ oneriId }: { oneriId: number }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const bag = "inline-flex min-h-9 items-center px-2.5 text-[13.5px] underline decoration-hairline underline-offset-2";

  if (!acik) {
    return (
      <span className="flex items-center gap-1">
        <Link href={`/oneri/${oneriId}#duzelt`} className={`${bag} text-ink-soft hover:text-ink`}>
          Düzelt
        </Link>
        <button type="button" onClick={() => setAcik(true)} className={`${bag} cursor-pointer text-conflict hover:decoration-conflict`}>
          Sil
        </button>
      </span>
    );
  }
  return (
    <EylemFormu
      eylem={oneriSilEylemi}
      onSonuc={(s) => s.ok && router.refresh()}
      className="w-full border border-conflict-line bg-conflict-tint px-3 py-3"
    >
      <input type="hidden" name="oneriId" value={oneriId} />
      <label className="block text-[13.5px] font-medium text-ink" htmlFor={`sil-${oneriId}`}>
        #{oneriId} kalıcı olarak silinsin mi?
      </label>
      <p className="mt-0.5 text-[12.5px] leading-[1.45] text-ink-soft">
        Geri alınamaz. Kaydın tam görüntüsü ve gerekçeniz denetime yazılır.
      </p>
      <input
        id={`sil-${oneriId}`}
        name="gerekce"
        required
        minLength={10}
        placeholder="Silme gerekçesi (ör. aynı konunun tekrarı, #325)"
        className="mt-2 min-h-10 w-full border border-hairline bg-surface px-3 text-[13.5px] text-ink"
      />
      <span className="mt-2 flex flex-wrap items-center gap-2">
        <Gonder varyant="kirmizi" bekleme="Siliniyor">
          Kalıcı olarak sil
        </Gonder>
        <button type="button" onClick={() => setAcik(false)} className={`${bag} cursor-pointer text-ink-soft`}>
          Vazgeç
        </button>
      </span>
    </EylemFormu>
  );
}
