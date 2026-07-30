"use client";

import { useState, useTransition } from "react";
import { naceAraEylemi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";
import { ALAN_ETIKET, GIRDI } from "./ui.tsx";

type Kayit = { kod: string; tanim: string; duzey: string };

/**
 * NACE seçici — yatırımcı biliyorsa girer, bilmiyorsa boş bırakır ve AI atar.
 *
 * ponytail: 3190 kodu istemciye göndermek yerine sunucuda arama. Tek eylem
 * çağrısı, kütüphane yok, açılır liste native.
 */
export function NaceSecici({ ad = "naceKod", secili }: { ad?: string; secili?: Kayit | null }) {
  const [deger, setDeger] = useState<Kayit | null>(secili ?? null);
  const [sorgu, setSorgu] = useState("");
  const [sonuc, setSonuc] = useState<Kayit[]>([]);
  const [bekliyor, gecis] = useTransition();
  const [acik, setAcik] = useState(false);

  function ara(q: string) {
    setSorgu(q);
    if (q.trim().length < 2) {
      setSonuc([]);
      return;
    }
    gecis(async () => {
      setSonuc(await naceAraEylemi(q));
      setAcik(true);
    });
  }

  return (
    <div>
      <input type="hidden" name={ad} value={deger?.kod ?? ""} />
      <label className={ALAN_ETIKET} htmlFor="nace-ara">
        NACE kodu · biliyorsanız girin
      </label>

      {deger ? (
        <div className="flex items-start gap-3 border border-verified-line bg-verified-tint px-3 py-2.5">
          <span className="font-mono text-[12px] text-verified" aria-hidden>
            ■
          </span>
          <div className="min-w-0 flex-1">
            <div className="num text-[13px] font-medium text-ink">{deger.kod}</div>
            <div className="mt-0.5 text-[12.5px] leading-[1.4] text-ink-soft">{deger.tanim}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeger(null);
              setSonuc([]);
              setSorgu("");
            }}
            className="cursor-pointer border border-hairline bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute"
          >
            Kaldır
          </button>
        </div>
      ) : (
        <>
          <input
            id="nace-ara"
            type="search"
            value={sorgu}
            onChange={(e) => ara(e.target.value)}
            placeholder="Kod (13.10) veya faaliyet adı yazın"
            autoComplete="off"
            className={GIRDI}
          />
          <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-soft">
            Bilmiyorsanız <b>boş bırakın</b> — yapay zekâ öneri metninizden en uygun kodu atar ve
            “doğrulanmadı” olarak işaretler. Ajans düzeltebilir.
          </p>

          {(bekliyor || (acik && sorgu.trim().length >= 2)) && (
            <div className="mt-2 max-h-[260px] overflow-y-auto border border-hairline bg-surface">
              {bekliyor && sonuc.length === 0 && (
                <div className="px-3 py-2.5 text-[12.5px] text-ink-mute">Aranıyor…</div>
              )}
              {!bekliyor && sonuc.length === 0 && (
                <div className="px-3 py-2.5 text-[12.5px] text-ink-mute">
                  Eşleşme yok. Boş bırakırsanız yapay zekâ atar.
                </div>
              )}
              {sonuc.map((n) => (
                <button
                  key={n.kod}
                  type="button"
                  onClick={() => {
                    setDeger(n);
                    setAcik(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-baseline gap-3 border-b border-b-[#E9E5DB] px-3 py-2.5 text-left last:border-b-0",
                    "hover:bg-paper",
                  )}
                >
                  <span className="num shrink-0 text-[12.5px] font-medium">{n.kod}</span>
                  <span className="text-[12.5px] leading-[1.4] text-ink-soft">{n.tanim}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
