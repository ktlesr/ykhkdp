"use client";

import { useState } from "react";
import Link from "next/link";
import { DOGRULAMA_ETIKET, epistemik, type DogrulamaDurumu } from "@ykh/domain";
import { EP } from "./epistemic-frame.tsx";
import { Cekmece } from "./ui/katman.tsx";

export type Kunye = {
  id: number;
  kod: string;
  kaynakKurum: string;
  belge: string;
  belgeSurum: string | null;
  sayfaTablo: string | null;
  yayimTarihi: string | null;
  cografiKapsam: string | null;
  veriDonemi: string | null;
  url: string | null;
  alinti: string | null;
  sinirlilik: string | null;
  katkiPuani: number;
  dogrulamaDurumu: string;
  dogrulayan: string | null;
  dogrulamaZamani: string | null;
  iddia?: string | null;
};

/**
 * OV-01 · Künye çekmecesi. Okuma amaçlı; sayfa bağlamı görünür kalır.
 * Kanıtın kendisi burada: kaynak kurum, belge sürümü, sayfa/tablo, alıntı,
 * sınırlılık ve kanıt yeterliliğine katkısı.
 */
export function KunyeCekmecesi({ kunye, konuYolu }: { kunye: Kunye; konuYolu?: string }) {
  const [acik, setAcik] = useState(false);
  const ep = EP[epistemik(kunye.dogrulamaDurumu as DogrulamaDurumu)];

  const alanlar: Array<[string, string | null]> = [
    ["Kaynak kurum", kunye.kaynakKurum],
    ["Belge", kunye.belgeSurum ? `${kunye.belge}, sürüm ${kunye.belgeSurum}` : kunye.belge],
    ["Yer", kunye.sayfaTablo],
    ["Yayım tarihi", kunye.yayimTarihi],
    ["Coğrafi kapsam", kunye.cografiKapsam],
    ["Veri dönemi", kunye.veriDonemi],
    ["İlişkili iddia", kunye.iddia ?? null],
    [
      "Kanıt yeterliliğine katkısı",
      kunye.dogrulamaDurumu === "uzman_onayli"
        ? `+${kunye.katkiPuani} puan`
        : `katkı yok — ${DOGRULAMA_ETIKET[kunye.dogrulamaDurumu as DogrulamaDurumu]}`,
    ],
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="cursor-pointer border border-hairline bg-surface px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute"
      >
        {kunye.kod} · künye
      </button>

      <Cekmece
        acik={acik}
        kapat={() => setAcik(false)}
        kod={kunye.kod}
        baslik={kunye.belge}
        altBar={
          <div className="flex gap-2.5">
            {konuYolu && (
              <Link
                href={konuYolu}
                className="border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
              >
                Konu detayına git
              </Link>
            )}
            <span className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink-mute">
              Bu kanıta itiraz et · Blok 4
            </span>
          </div>
        }
      >
        <div className="border-b border-b-hairline-soft px-[22px] py-[18px]">
          <div className={`flex items-center gap-2.5 border px-3 py-2.5 ${ep.kenar} ${ep.doku} border-hairline`}>
            <span className={`font-mono text-[12px] ${ep.yazi}`} aria-hidden>
              {ep.isaret}
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-[.12em] ${ep.yazi}`}>
              {DOGRULAMA_ETIKET[kunye.dogrulamaDurumu as DogrulamaDurumu]}
              {kunye.dogrulayan && ` · ${kunye.dogrulayan}`}
              {kunye.dogrulamaZamani && ` · ${kunye.dogrulamaZamani.slice(0, 10)}`}
            </span>
          </div>
        </div>

        <div className="px-[22px] pt-1 pb-2">
          {alanlar
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[150px_1fr] gap-3.5 border-b border-dotted border-b-hairline-soft py-2.5"
              >
                <span className="font-mono text-[10px] uppercase tracking-[.11em] text-ink-mute">{k}</span>
                <span className="text-[13px] leading-[1.45] text-ink">{v}</span>
              </div>
            ))}
        </div>

        {kunye.alinti && (
          <div className="border-t border-t-hairline-soft bg-paper px-[22px] py-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[.12em] text-ink-mute">Kaynaktan alıntı</div>
            <blockquote className="border-l-2 border-l-ink pl-3.5 font-display text-[15.5px] leading-[1.6] text-ink text-pretty">
              “{kunye.alinti}”
            </blockquote>
          </div>
        )}

        {kunye.sinirlilik && (
          <div className="border-t border-t-hairline-soft px-[22px] py-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[.12em] text-conflict">Sınırlılık</div>
            <p className="text-[13px] leading-[1.5] text-ink-soft">{kunye.sinirlilik}</p>
          </div>
        )}
      </Cekmece>
    </>
  );
}
