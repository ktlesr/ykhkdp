"use client";

import { cn } from "@/lib/utils.ts";
import { useState } from "react";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { ALAN_ETIKET, GIRDI, DUGME_STIL, DUGME_TABAN } from "./ui.tsx";
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
 * Belge ekleme. Dosya yüklenir (PDF/Word/Excel sunucuda Markdown'a çevrilir,
 * `lib/belge-cevir.ts`) veya metin yapıştırılır.
 */
export function BelgeFormu({
  iller,
}: {
  iller: Array<{ kod: string; ad: string; ajansKod: string; ajans: string }>;
}) {
  const ajanslar = [...new Map(iller.map((x) => [x.ajansKod, x.ajans])).entries()].sort(([a], [b]) => a.localeCompare(b));
  const ilSirali = [...iller].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  const [acik, setAcik] = useState(false);
  // Kapsam İKİ ADIMDA: önce tür (ulusal/ajans/il), gerekiyorsa ikinci seçim.
  // 108 seçenekli tek liste yanlış gruba gitmeyi kolaylaştırıyordu.
  const [tur, setTur] = useState("");
  const [kapsamTur, setKapsamTur] = useState("");
  const [kapsamKod, setKapsamKod] = useState("");
  const [metin, setMetin] = useState("");

  if (!acik) {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setAcik(true)}
          className={cn(DUGME_TABAN, DUGME_STIL.dolu)}
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
      <div className="serit flex items-center justify-between px-4 py-2.5 etiket text-ink-soft">
        <span>Yeni belge</span>
        <button type="button" onClick={() => setAcik(false)} className="cursor-pointer text-ink-mute hover:text-ink">
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
            <select
              id="tur"
              name="tur"
              className={GIRDI}
              value={tur}
              onChange={(e) => {
                setTur(e.target.value);
                if (e.target.value === "bolge_plani" && kapsamTur === "ulusal") setKapsamTur("");
              }}
              required
            >
              <option value="" disabled>
                Tür seçin
              </option>
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
            <label className={ALAN_ETIKET} htmlFor="kapsam-tur">
              Kapsam
            </label>
            {/* Varsayılan YOK: bölge planı yanlışlıkla bütün illere açılmasın. */}
            <input type="hidden" name="kapsam" value={kapsamTur === "ulusal" ? "ulusal" : `${kapsamTur}:${kapsamKod}`} />
            <select
              id="kapsam-tur"
              className={GIRDI}
              value={kapsamTur}
              onChange={(e) => {
                setKapsamTur(e.target.value);
                setKapsamKod("");
              }}
              required
            >
              <option value="" disabled>
                Kapsam seçin
              </option>
              <option value="ulusal" disabled={tur === "bolge_plani"}>
                Ulusal · tüm iller
              </option>
              <option value="ajans">Bir ajans bölgesi</option>
              <option value="il">Tek bir il</option>
            </select>
            {(kapsamTur === "ajans" || kapsamTur === "il") && (
              <>
                <label className={`${ALAN_ETIKET} mt-3`} htmlFor="kapsam-kod">
                  {kapsamTur === "ajans" ? "Ajans bölgesi" : "İl"}
                </label>
                <select
                  id="kapsam-kod"
                  className={GIRDI}
                  value={kapsamKod}
                  onChange={(e) => setKapsamKod(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Seçin
                  </option>
                  {kapsamTur === "ajans"
                    ? ajanslar.map(([kod, ad]) => (
                        <option key={kod} value={kod}>
                          {kod} · {ad}
                        </option>
                      ))
                    : ilSirali.map((x) => (
                        <option key={x.kod} value={x.kod}>
                          {x.ad}
                        </option>
                      ))}
                </select>
              </>
            )}
          </div>
        </div>

        <label className={`${ALAN_ETIKET} mt-4`} htmlFor="dosya">
          Dosya · PDF, Word (.docx), Excel (.xlsx), .txt veya .md · en çok 30 MB
        </label>
        <input
          id="dosya"
          name="dosya"
          type="file"
          accept=".pdf,.docx,.xlsx,.txt,.md"
          className="min-h-11 w-full border border-dashed border-hairline bg-paper hover:border-ink-mute px-3 py-2.5 text-[13px]"
        />

        <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-soft">
          Dosya metne çevrilir ve kalitesi ölçülür; paragrafları bozuk çıkan dosya yüklenmez. Taranmış
          (görüntü) PDF okunmaz.
        </p>

        <label className={`${ALAN_ETIKET} mt-4`} htmlFor="metin">
          Veya metni yapıştırın · en az 200 karakter
        </label>
        <textarea
          id="metin"
          name="metin"
          rows={8}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          className="w-full resize-y border border-hairline bg-alan px-3 py-2.5 text-[13px] leading-[1.5] text-ink"
          placeholder="Dosya yerine metni buraya yapıştırabilirsiniz."
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
