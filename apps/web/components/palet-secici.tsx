"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { paletEylemi } from "@/lib/eylem.ts";
import { PALETLER, type PaletKimlik } from "@/lib/palet.ts";

/**
 * Renk paleti seçimi.
 *
 * Seçim anında uygulanır: `document.documentElement.dataset.palet` değiştirilip
 * sonuç canlı görülür, sonra sunucuya yazılır. Yazma başarısızsa önceki palete
 * geri dönülür — ekranda görülen ile kayıtlı olan asla ayrışmaz.
 */
export function PaletSecici({ secili }: { secili: PaletKimlik }) {
  const router = useRouter();
  const [aktif, setAktif] = useState<PaletKimlik>(secili);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, basla] = useTransition();

  const uygula = (id: PaletKimlik) => {
    if (id === aktif || bekliyor) return;
    const onceki = aktif;
    setAktif(id);
    setHata(null);
    document.documentElement.dataset.palet = id;

    basla(async () => {
      const s = await paletEylemi(id);
      if (!s.ok) {
        setAktif(onceki);
        document.documentElement.dataset.palet = onceki;
        setHata(s.mesaj);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-6 border border-hairline bg-surface">
      <div className="panel-koyu flex flex-wrap items-baseline justify-between gap-3 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em]">
        <span>Renk paleti</span>
        <span className="text-[#C9CDD3]">{bekliyor ? "kaydediliyor" : `${PALETLER.length} set`}</span>
      </div>

      <p className="border-b border-b-hairline-soft px-4 py-2.5 text-[12.5px] leading-[1.45] text-ink-soft">
        Palet yalnızca <b className="font-medium">rengi</b> değiştirir. Tipografi, boşluk, kenar yarıçapı ve hareket
        devir paketindeki kurallara tabidir ve paletle oynamaz. Her palette “uzman onaylı”, “doğrulanmadı”,
        “dayanak yok” ve “çıkıyor” renkleri ayrı ayrı doğrulanır: zeminde en az 4,5:1 kontrast ve birbirinden en az
        özgün paletin ulaştığı ayrışma.
      </p>

      <fieldset>
        <legend className="sr-only">Renk paleti seçimi</legend>
        {PALETLER.map((p) => {
          const bu = p.id === aktif;
          return (
            <label
              key={p.id}
              className={[
                "flex cursor-pointer items-start gap-4 border-b border-b-hairline-soft px-4 py-4 last:border-b-0",
                bu ? "bg-paper" : "bg-surface",
              ].join(" ")}
            >
              <input
                type="radio"
                name="palet"
                value={p.id}
                checked={bu}
                disabled={bekliyor}
                onChange={() => uygula(p.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-navy)]"
              />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[15px] font-medium">{p.ad}</span>
                  <span className="num font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">{p.id}</span>
                  {bu && (
                    <span className="font-mono text-[10px] uppercase tracking-[.1em] text-verified">
                      <span aria-hidden>■</span> yürürlükte
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block max-w-[70ch] text-[13px] leading-[1.5] text-pretty text-ink-soft">
                  {p.aciklama}
                </span>
                {p.kalibrasyon && (
                  <span className="mt-2 block max-w-[70ch] text-[12.5px] leading-[1.45] text-pretty text-ink-mute">
                    <b className="font-medium">Kalibrasyon:</b> {p.kalibrasyon}
                  </span>
                )}
              </span>

              {/* Örnek şerit: zemin · kağıt · marka · onaylı · doğrulanmadı */}
              <span aria-hidden className="flex shrink-0 border border-hairline">
                {p.ornek.map((renk, i) => (
                  <span
                    key={i}
                    style={{ background: renk }}
                    className="h-9 w-7 border-r border-r-hairline last:border-r-0"
                  />
                ))}
              </span>
            </label>
          );
        })}
      </fieldset>

      {hata && (
        <p className="border-t border-t-conflict-line bg-conflict-tint px-4 py-3 text-[13px] text-ink">{hata}</p>
      )}
    </div>
  );
}
