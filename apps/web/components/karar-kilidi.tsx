"use client";

import { useState } from "react";
import type { Hesap } from "@ykh/domain";
import { KILIT_ONAY_KELIMESI } from "@ykh/domain";
import { EylemFormu, OnayliGonder } from "./eylem-formu.tsx";
import { KararTabakasi } from "./ui/katman.tsx";
import { kilitEylemi } from "@/lib/eylem.ts";

/**
 * OV-02 · Karar tabakası. Geri alınamaz işlem.
 *
 * Varsayılan odak Vazgeç'te; onay butonu yazılı doğrulama olmadan pasif ve
 * görsel olarak avantajlı değil (otomasyon yanlılığına karşı).
 */
export function KararKilidi({
  il,
  yil,
  ilAdi,
  surum,
  hesap,
}: {
  il: string;
  yil: string;
  ilAdi: string;
  surum: string;
  hesap: Hesap;
}) {
  const [acik, setAcik] = useState(false);
  const [onay, setOnay] = useState("");
  const [gerekce, setGerekce] = useState("");

  const hazir = onay.trim().toLocaleUpperCase("tr-TR") === KILIT_ONAY_KELIMESI && gerekce.trim().length >= 20;
  const bosSlot = hesap.ozet.bosSlot > 0;
  const cikan = hesap.ozet.cikiyor > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="min-h-11 cursor-pointer border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
      >
        Kurul kararını kilitle
      </button>

      <KararTabakasi
        acik={acik}
        kapat={() => setAcik(false)}
        ustEtiket="Karar tabakası · geri alınamaz işlem"
        baslik={`${yil} dönemi kararını kilitle`}
        kunye={
          <div className="border border-hairline bg-surface px-2.5 py-2 text-right font-mono text-[10px] leading-[1.9] uppercase tracking-[.1em] text-ink-mute">
            <div>Sürüm {surum}</div>
            <div>
              {ilAdi} · {yil}
            </div>
            <div>Devamlılık payı +{hesap.pay}</div>
          </div>
        }
        altBar={
          <>
            <button
              type="button"
              autoFocus
              onClick={() => setAcik(false)}
              className="min-h-11 cursor-pointer border border-ink px-4 py-[11px] font-mono text-[11px] uppercase tracking-[.1em] text-ink"
            >
              Vazgeç
            </button>
            <p className="max-w-[34ch] text-[12.5px] leading-[1.4] text-ink-mute">
              Kilit işlemi kayıt defterine adınız ve saatle birlikte yazılır.
            </p>
            <EylemFormu eylem={kilitEylemi} className="ml-auto" surum={surum}>
              <input type="hidden" name="il" value={il} />
              <input type="hidden" name="yil" value={yil} />
              <input type="hidden" name="onay" value={onay} />
              <input type="hidden" name="gerekce" value={gerekce} />
              <OnayliGonder hazir={hazir}>Kararı kilitle</OnayliGonder>
            </EylemFormu>
          </>
        }
      >
        <p className="max-w-[70ch] text-[14px] leading-[1.55] text-ink text-pretty">
          Kilit sonrası bu dönem <b>salt okunur</b> olur: puanlar, kanıt bağları ve slot kararları sürüm damgasıyla
          dondurulur. Değişiklik ancak <b>yeni bir sürüm</b> açılarak yapılır ve gerekçesi kamuya açık kayda geçer.
        </p>

        <div className="mt-4 border border-hairline bg-surface">
          <div className="border-b border-b-hairline-soft px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[.12em] text-ink-mute">
            Kilitlenecek içerik
          </div>
          {hesap.ilkDort.map((s) => (
            <div
              key={s.sira}
              className="grid grid-cols-[26px_1fr_130px] items-center gap-3 border-b border-dotted border-b-hairline-soft px-3.5 py-2.5"
            >
              <span className="num font-display text-[17px] text-ink-mute">{s.sira}</span>
              <span className="text-[13.5px] text-ink">
                {s.bos ? "Slot boş — yeterli kanıtlı aday yok" : s.ad}
              </span>
              <span
                className={
                  "text-right font-mono text-[10px] uppercase tracking-[.1em] " +
                  (s.bos
                    ? "text-absent"
                    : s.sonuc === "korunuyor"
                      ? "text-verified"
                      : s.sonuc === "ekleniyor"
                        ? "text-navy"
                        : "text-conflict")
                }
              >
                {s.bos ? "gerekçe zorunlu" : s.sonuc}
              </span>
            </div>
          ))}
        </div>

        {(bosSlot || cikan) && (
          <div className="mt-4 border border-unverif-line border-l-[3px] border-l-unverif bg-unverif-tint px-3.5 py-3">
            <div className="text-[13.5px] font-semibold text-[#5F4A15]">
              Gerekçe zorunlu:{" "}
              {[bosSlot && `${hesap.ozet.bosSlot} slot boş bırakılıyor`, cikan && `${hesap.ozet.cikiyor} mevcut konu listeden çıkıyor`]
                .filter(Boolean)
                .join(" ve ")}
              .
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-soft">
              Bu durumlar kamuya açık kayda ayrı ayrı yazılır.
            </p>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="kilit-gerekce"
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-[.12em] text-ink-mute"
          >
            Kurul gerekçesi · en az 20 karakter
          </label>
          <textarea
            id="kilit-gerekce"
            rows={3}
            value={gerekce}
            onChange={(e) => setGerekce(e.target.value)}
            className="w-full resize-y border border-hairline bg-surface px-3 py-[11px] text-[13.5px] leading-[1.5] text-ink"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="kilit-onay" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[.12em] text-ink-mute">
            Onay için <b className="text-ink">{KILIT_ONAY_KELIMESI}</b> yaz
          </label>
          <input
            id="kilit-onay"
            value={onay}
            onChange={(e) => setOnay(e.target.value)}
            placeholder={KILIT_ONAY_KELIMESI}
            className="w-[220px] border border-ink bg-surface px-3 py-2.5 font-mono text-[14px] uppercase tracking-[.16em] text-ink"
          />
        </div>
      </KararTabakasi>
    </>
  );
}
