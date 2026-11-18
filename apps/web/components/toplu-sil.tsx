"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { kesifAdaylariniSilEylemi } from "@/lib/eylem.ts";

/**
 * Kuyruktaki keşif adaylarını topluca siler — yalnızca yönetici.
 *
 * Tekil silmeyle aynı iki adım: düğme yalnızca onay alanını açar; kalıcı silme
 * gerekçe ister. Kapsam ekrandaki süzgeçtir (bütün iller / bölge / il) ve
 * yalnızca keşfin ürettiği adaylar silinir; elle girilen öneriler kalır.
 */
export function TopluSil({ adet, bolge, il, kapsamAdi }: { adet: number; bolge: string; il: string; kapsamAdi: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const bag = "inline-flex min-h-9 items-center px-2.5 text-[13.5px] underline decoration-hairline underline-offset-2";
  if (!adet) return null;
  if (!acik) {
    return (
      <p className="mt-3">
        <button type="button" onClick={() => setAcik(true)} className={`${bag} cursor-pointer px-0 text-conflict hover:decoration-conflict`}>
          Keşif adaylarını topluca sil ({adet})
        </button>
      </p>
    );
  }
  return (
    <EylemFormu
      eylem={kesifAdaylariniSilEylemi}
      onSonuc={(s) => {
        if (s.ok) {
          setAcik(false);
          router.refresh();
        }
      }}
      className="mt-3 border border-conflict-line bg-conflict-tint px-3 py-3"
    >
      <input type="hidden" name="bolge" value={bolge} />
      <input type="hidden" name="il" value={il} />
      <label className="block text-[13.5px] font-medium text-ink" htmlFor="toplu-sil">
        {kapsamAdi} için kuyruktaki {adet} keşif adayı kalıcı olarak silinsin mi?
      </label>
      <p className="mt-0.5 text-[12.5px] leading-[1.45] text-ink-soft">
        Geri alınamaz. Yalnızca belgelerden keşfin ürettiği, henüz onaylanmamış adaylar silinir; yatırımcının ve ajansın
        elle girdiği öneriler, onaylanmış ya da reddedilmiş kayıtlar ve resmî konular kalır. Her kaydın tam görüntüsü
        denetime yazılır.
      </p>
      <input
        id="toplu-sil"
        name="gerekce"
        required
        minLength={10}
        placeholder="Silme gerekçesi (ör. keşif yeni kaynaklarla yeniden koşturulacak)"
        className="mt-2 min-h-10 w-full border border-hairline bg-surface px-3 text-[13.5px] text-ink"
      />
      <span className="mt-2 flex flex-wrap items-center gap-2">
        <Gonder varyant="kirmizi" bekleme="Siliniyor">
          {adet} adayı kalıcı olarak sil
        </Gonder>
        <button type="button" onClick={() => setAcik(false)} className={`${bag} cursor-pointer text-ink-soft`}>
          Vazgeç
        </button>
      </span>
    </EylemFormu>
  );
}
