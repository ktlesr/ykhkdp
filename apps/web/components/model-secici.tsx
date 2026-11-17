"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { modelEylemi } from "@/lib/eylem.ts";

export type ModelSatiri = { id: string; ad: string; model: string; anahtarVar: boolean; aciklama: string };

/**
 * Yapay zekâ modeli seçimi — yalnızca yönetici. Anahtarı tanımlı olmayan
 * sağlayıcı seçilemez: seçim kaydedilse bile her çağrı hata verirdi.
 */
export function ModelSecici({
  gorev,
  baslik,
  aciklama,
  secili,
  secenekler,
}: {
  gorev: "yargi" | "tarama";
  baslik: string;
  aciklama: string;
  secili: string;
  secenekler: ModelSatiri[];
}) {
  const router = useRouter();
  const [aktif, setAktif] = useState(secili);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, basla] = useTransition();

  const uygula = (id: string) => {
    if (id === aktif || bekliyor) return;
    const onceki = aktif;
    setAktif(id);
    setHata(null);
    basla(async () => {
      const s = await modelEylemi(gorev, id);
      if (!s.ok) {
        setAktif(onceki);
        setHata(s.mesaj);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-6 border border-hairline bg-surface">
      <div className="serit flex flex-wrap items-baseline justify-between gap-3 px-4 py-2.5 etiket">
        <span>{baslik}</span>
        <span className="text-ink-mute">{bekliyor ? "kaydediliyor" : `${secenekler.length} seçenek`}</span>
      </div>
      <p className="border-b border-b-hairline-soft px-4 py-2.5 text-[12.5px] leading-[1.45] text-ink-soft">{aciklama}</p>
      <fieldset>
        <legend className="sr-only">{baslik} seçimi</legend>
        {secenekler.map((m) => {
          const bu = m.id === aktif;
          return (
            <label
              key={m.id}
              className={[
                "flex items-start gap-4 border-b border-b-hairline-soft px-4 py-4 last:border-b-0",
                m.anahtarVar ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                bu ? "bg-paper" : "bg-surface",
              ].join(" ")}
            >
              <input
                type="radio"
                name={`model-${gorev}`}
                value={m.id}
                checked={bu}
                disabled={bekliyor || !m.anahtarVar}
                onChange={() => uygula(m.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-navy)]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[15px] font-medium">{m.ad}</span>
                  <span className="num etiket text-ink-mute">{m.model}</span>
                  {bu && (
                    <span className="etiket text-verified">
                      <span aria-hidden>■</span> yürürlükte
                    </span>
                  )}
                  {!m.anahtarVar && <span className="etiket text-conflict">anahtar tanımlı değil</span>}
                </span>
                <span className="mt-1.5 block max-w-[70ch] text-[13px] leading-[1.5] text-pretty text-ink-soft">{m.aciklama}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      {hata && <p className="border-t border-t-conflict-line bg-conflict-tint px-4 py-3 text-[13px] text-ink">{hata}</p>}
    </div>
  );
}
