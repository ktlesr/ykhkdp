"use client";

import { useState } from "react";
import { olasiGecisler, type OneriDurumu } from "@ykh/domain";
import { KRITERLER, KRITER_ETIKET, type Kriter } from "@ykh/scoring";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { NaceSecici } from "./nace-secici.tsx";
import { ALAN_ETIKET, Dugme } from "./ui.tsx";
import { durumEylemi, naceEylemi, puanEylemi } from "@/lib/eylem.ts";

/**
 * Ajans kutusu: onayla / reddet / puanı düzelt / NACE düzelt.
 *
 * Onay geri alınabilir; kilit yok. Ret gerekçe ister.
 */
export function OnayKutusu({
  oneriId,
  durum,
  yol,
  puanlar,
}: {
  oneriId: number;
  durum: OneriDurumu;
  yol: string;
  puanlar: Record<Kriter, number> | null;
}) {
  const [acik, setAcik] = useState<"puan" | "nace" | null>(null);
  const gecisler = olasiGecisler(durum, "ajans");

  return (
    <div className="mt-6 border border-ink bg-surface">
      <div className="panel-koyu px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.12em] text-[#C9CDD3]">
        Ajans işlemleri
      </div>

      <div className="px-4 py-4">
        {gecisler.length > 0 && (
          <EylemFormu eylem={durumEylemi}>
            <input type="hidden" name="oneriId" value={oneriId} />
            <input type="hidden" name="mevcut" value={durum} />
            <input type="hidden" name="yol" value={yol} />
            <label className={ALAN_ETIKET} htmlFor={`gerekce-${oneriId}`}>
              Gerekçe · ret ve geri alma için zorunlu
            </label>
            <textarea
              id={`gerekce-${oneriId}`}
              name="gerekce"
              rows={2}
              className="w-full resize-y border border-hairline bg-alan px-3 py-2.5 text-[13px] leading-[1.5] text-ink"
            />
            <div className="mt-3 flex flex-wrap gap-2.5">
              {gecisler.map((g) => (
                <Gonder
                  key={g.to}
                  name="durum"
                  value={g.to}
                  varyant={g.to === "listede" ? "dolu" : g.to === "reddedildi" ? "kirmizi" : "cizgi"}
                >
                  {g.eylem}
                </Gonder>
              ))}
            </div>
          </EylemFormu>
        )}

        <div className="mt-4 flex flex-wrap gap-2.5 border-t border-t-hairline-soft pt-4">
          <Dugme varyant="cizgi" type="button" onClick={() => setAcik(acik === "puan" ? null : "puan")}>
            {acik === "puan" ? "Puan düzeltmeyi kapat" : "Puanı düzelt"}
          </Dugme>
          <Dugme varyant="cizgi" type="button" onClick={() => setAcik(acik === "nace" ? null : "nace")}>
            {acik === "nace" ? "NACE düzeltmeyi kapat" : "NACE'yi düzelt"}
          </Dugme>
        </div>

        {acik === "puan" && (
          <EylemFormu eylem={puanEylemi} className="mt-4 border border-hairline-soft bg-paper p-4">
            <input type="hidden" name="oneriId" value={oneriId} />
            <input type="hidden" name="yol" value={yol} />
            <p className="mb-3 text-[12.5px] leading-[1.45] text-ink-soft">
              Yapay zekânın ham puanı kayıtta korunur; düzeltmeniz ayrı sütuna yazılır ve denetim izine geçer.
            </p>
            <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              {KRITERLER.map((kr) => (
                <div key={kr}>
                  <label className="mb-1 block text-[11.5px] leading-[1.3] text-ink-soft" htmlFor={`${kr}-${oneriId}`}>
                    {KRITER_ETIKET[kr]}
                  </label>
                  <input
                    id={`${kr}-${oneriId}`}
                    name={kr}
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={puanlar?.[kr] ?? 0}
                    className="num min-h-11 w-full border border-hairline bg-surface px-3 py-2 text-[13.5px]"
                  />
                </div>
              ))}
            </div>
            <label className={`${ALAN_ETIKET} mt-3`} htmlFor={`puan-gerekce-${oneriId}`}>
              Düzeltme gerekçesi
            </label>
            <textarea
              id={`puan-gerekce-${oneriId}`}
              name="gerekce"
              rows={2}
              required
              className="w-full resize-y border border-hairline bg-surface px-3 py-2.5 text-[13px] leading-[1.5]"
            />
            <div className="mt-3">
              <Gonder>Puanı kaydet</Gonder>
            </div>
          </EylemFormu>
        )}

        {acik === "nace" && (
          <EylemFormu eylem={naceEylemi} className="mt-4 border border-hairline-soft bg-paper p-4">
            <input type="hidden" name="oneriId" value={oneriId} />
            <input type="hidden" name="yol" value={yol} />
            <NaceSecici />
            <div className="mt-3">
              <Gonder>NACE'yi kaydet</Gonder>
            </div>
          </EylemFormu>
        )}
      </div>
    </div>
  );
}
