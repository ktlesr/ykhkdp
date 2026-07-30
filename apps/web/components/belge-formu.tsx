"use client";

import { useState } from "react";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { ALAN_ETIKET, GIRDI } from "./ui.tsx";
import { belgeEylemi } from "@/lib/eylem.ts";

const TURLER = [
  ["bolge_plani", "Bölge planı"],
  ["kalkinma_plani", "Kalkınma planı"],
  ["ovp", "Orta vadeli program"],
  ["strateji", "Strateji belgesi"],
  ["il_raporu", "İl raporu"],
  ["diger", "Diğer"],
] as const;

/**
 * Belge ekleme. Metin dosyası yüklenir veya metin yapıştırılır.
 *
 * ponytail: PDF/docx ayrıştırıcısı yok — bu ekranda .txt/.md kabul ediliyor,
 * PDF için metni yapıştırma yolu açık. Ayrıştırıcı gerekirse tek eylem değişir.
 */
export function BelgeFormu({ iller }: { iller: Array<{ kod: string; ad: string }> }) {
  const [acik, setAcik] = useState(false);
  const [metin, setMetin] = useState("");

  if (!acik) {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="min-h-11 cursor-pointer border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
        >
          Belge ekle
        </button>
      </div>
    );
  }

  return (
    <EylemFormu
      eylem={belgeEylemi}
      className="mt-5 border border-ink bg-surface"
      onSonuc={(s) => {
        if (s.ok) {
          setAcik(false);
          setMetin("");
        }
      }}
    >
      <div className="flex items-center justify-between bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.12em] text-[#C9CDD3]">
        <span>Yeni belge</span>
        <button type="button" onClick={() => setAcik(false)} className="cursor-pointer text-[#8E959F]">
          Kapat
        </button>
      </div>

      <div className="px-4 py-4">
        <label className={ALAN_ETIKET} htmlFor="ad">
          Belge adı
        </label>
        <input id="ad" name="ad" required minLength={5} className={GIRDI} placeholder="TR33 Bölge Planı 2024-2028" />

        <div className="mt-4 grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
          <div>
            <label className={ALAN_ETIKET} htmlFor="tur">
              Tür
            </label>
            <select id="tur" name="tur" className={GIRDI} defaultValue="bolge_plani">
              {TURLER.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ALAN_ETIKET} htmlFor="yil">
              Yıl
            </label>
            <input id="yil" name="yil" className={GIRDI} placeholder="2024" inputMode="numeric" />
          </div>
          <div>
            <label className={ALAN_ETIKET} htmlFor="ilKod">
              Kapsam
            </label>
            <select id="ilKod" name="ilKod" className={GIRDI} defaultValue="">
              <option value="">Ulusal / tüm iller</option>
              {iller.map((x) => (
                <option key={x.kod} value={x.kod}>
                  {x.ad} iline özgü
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className={`${ALAN_ETIKET} mt-4`} htmlFor="dosya">
          Metin dosyası · .txt veya .md
        </label>
        <input
          id="dosya"
          name="dosya"
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="min-h-11 w-full border border-dashed border-hairline bg-[repeating-linear-gradient(135deg,#FFF_0_6px,#F6F4EF_6px_12px)] px-3 py-2.5 text-[13px]"
        />

        <label className={`${ALAN_ETIKET} mt-4`} htmlFor="metin">
          Veya metni yapıştırın · en az 200 karakter
        </label>
        <textarea
          id="metin"
          name="metin"
          rows={8}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          className="w-full resize-y border border-hairline bg-[#FDFCFA] px-3 py-2.5 text-[13px] leading-[1.5] text-ink"
          placeholder="PDF'ten kopyaladığınız metni buraya yapıştırabilirsiniz."
        />
        <div className="num mt-1.5 text-[10px] text-ink-mute">{metin.length} karakter</div>

        <p className="mt-3 text-[12px] leading-[1.45] text-ink-soft">
          Yapay zekâ yalnızca bu metinden <b>birebir alıntı</b> yapabilir; uydurulmuş alıntı tüm değerlendirmeyi
          reddettirir. Belge ne kadar somut olursa dayanak puanları o kadar yüksek olur.
        </p>

        <div className="mt-4">
          <Gonder>Belgeyi kaydet</Gonder>
        </div>
      </div>
    </EylemFormu>
  );
}
