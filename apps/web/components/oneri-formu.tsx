"use client";

import { useState, useTransition } from "react";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { BenzerlikKatmani } from "./ui/katman.tsx";
import { EvidenceBand } from "./evidence-band.tsx";
import { benzerlikKontrolu, oneriEylemi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Blok 3 · Kademe 1 — hızlı öneri. Mobil öncelikli, tüm dokunma hedefleri ≥44px.
 * Yedi bölümlü zorunlu form yok: kanıt şart değil, dosya sonra güçlendirilir.
 */

const ETIKET = "mt-4 mb-1.5 block font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute";
const GIRDI = "min-h-11 w-full border border-hairline bg-[#FDFCFA] px-3 py-[11px] text-[14px] text-ink";

const TURLER = [
  { kod: "yeni", ad: "Yeni yatırım konusu", alt: "Listede olmayan bir konu öner" },
  { kod: "koruma", ad: "Mevcut konunun korunması", alt: "Mevcut konulardan birinin kalmasını savun" },
  { kod: "kapsam", ad: "Kapsam değişikliği", alt: "Mevcut bir konunun tanımını daralt veya genişlet" },
] as const;

type Benzer = { id: number; baslik: string; kanit: number; destek: number; benzerlik: number };

export function OneriFormu({
  donemId,
  ilAdi,
  yil,
  ilceler,
  girisYapildi,
}: {
  donemId: number;
  ilAdi: string;
  yil: string;
  ilceler: string[];
  girisYapildi: boolean;
}) {
  const [tur, setTur] = useState<string>("yeni");
  const [baslik, setBaslik] = useState("");
  const [tanim, setTanim] = useState("");
  const [neden, setNeden] = useState("");
  const [ilce, setIlce] = useState(ilceler[0] ?? "Merkez");
  const [naceOnay, setNaceOnay] = useState(false);
  const [benzerler, setBenzerler] = useState<Benzer[] | null>(null);
  const [bekliyor, gecis] = useTransition();

  // Kademe 1 alanlarının dosya puanına katkısı (Blok 3 tablosu).
  const adimlar = [
    { ad: "Konu başlığı ve tanım", puan: 18, tam: baslik.length > 8 && tanim.length > 40 },
    { ad: "İl, ilçe ve “neden burada” gerekçesi", puan: 14, tam: neden.length > 30 },
    { ad: "NACE sınıflandırmasını onaylama", puan: 12, tam: naceOnay },
    { ad: "En az bir kanıt kartı", puan: 22, tam: false },
    { ad: "Yatırımcı ilgisi veya talep belgesi", puan: 18, tam: false },
    { ad: "Uygulanabilirlik alanları (arazi, enerji, işgücü)", puan: 16, tam: false },
  ];
  const dosyaPuani = adimlar.reduce((t, a) => t + (a.tam ? a.puan : 0), 0);

  function benzerlikBak() {
    gecis(async () => {
      const r = await benzerlikKontrolu(donemId, baslik, naceOnay ? "NACE 13.10" : "", ilce);
      setBenzerler(r.filter((x) => x.benzerlik >= 30));
    });
  }

  const hazir = baslik.length > 8 && tanim.length > 40;

  return (
    <div className="grid grid-cols-[404px_1fr] items-start gap-7 max-[1100px]:grid-cols-1">
      {/* Kademe 1 */}
      <div>
        <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[.14em] text-ink-mute">
          Kademe 1 · hızlı öneri
        </div>
        <div className="border border-ink bg-surface">
          <div className="flex items-center justify-between bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.12em] text-[#C9CDD3]">
            <span>
              {ilAdi} · {yil} dönemi
            </span>
            <span>Öneri ver</span>
          </div>

          <EylemFormu eylem={oneriEylemi} className="px-4 pt-[18px] pb-4">
            <input type="hidden" name="donemId" value={donemId} />
            <input type="hidden" name="tur" value={tur} />
            <input type="hidden" name="ilce" value={ilce} />
            <input type="hidden" name="nace" value={naceOnay ? "NACE 13.10" : ""} />
            {naceOnay && <input type="hidden" name="naceOnayli" value="on" />}

            <div className="font-display text-[24px] leading-[1.16]">Bir yatırım konusu öner</div>
            <p className="mt-[7px] text-[13px] leading-[1.5] text-ink-soft">
              Kanıt şart değil. Önerini şimdi bırak, dosyayı sonra güçlendir. Sistem sana ne eksik olduğunu ve
              sıralamaya etkisini söyler.
            </p>

            <div className={ETIKET}>Öneri türü</div>
            <div className="flex flex-col gap-[7px]">
              {TURLER.map((t) => {
                const secili = tur === t.kod;
                return (
                  <button
                    key={t.kod}
                    type="button"
                    onClick={() => setTur(t.kod)}
                    aria-pressed={secili}
                    className={cn(
                      "flex min-h-[52px] w-full cursor-pointer items-start gap-2.5 border px-3 py-[11px] text-left",
                      secili ? "border-ink bg-ink" : "border-hairline bg-surface",
                    )}
                  >
                    <span
                      className={cn("font-mono text-[12px] leading-[1.3]", secili ? "text-paper" : "text-ink")}
                      aria-hidden
                    >
                      {secili ? "■" : "□"}
                    </span>
                    <span>
                      <span
                        className={cn("block text-[13.5px] font-medium", secili ? "text-paper" : "text-ink")}
                      >
                        {t.ad}
                      </span>
                      <span className={cn("mt-0.5 block text-[12px]", secili ? "text-[#9AA1AB]" : "text-ink-mute")}>
                        {t.alt}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <label className={ETIKET} htmlFor="baslik">
              Konu başlığı
            </label>
            <input
              id="baslik"
              name="baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className={GIRDI}
              required
            />

            <label className={ETIKET} htmlFor="tanim">
              Kısa tanım · birkaç cümle
            </label>
            <textarea
              id="tanim"
              name="tanim"
              rows={4}
              value={tanim}
              onChange={(e) => setTanim(e.target.value.slice(0, 600))}
              className="w-full resize-y border border-hairline bg-[#FDFCFA] px-3 py-[11px] text-[13.5px] leading-[1.5] text-ink"
              required
            />
            <div className="num mt-1.5 text-[10px] text-ink-mute">{tanim.length} / 600 karakter</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">İl</div>
                <div className="min-h-11 border border-hairline-soft bg-paper px-3 py-[11px] text-[14px] text-ink-mute">
                  {ilAdi} · sabit değil
                </div>
              </div>
              <div>
                <label
                  className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute"
                  htmlFor="ilce"
                >
                  İlçe
                </label>
                <select
                  id="ilce"
                  value={ilce}
                  onChange={(e) => setIlce(e.target.value)}
                  className={GIRDI}
                >
                  {ilceler.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className={ETIKET} htmlFor="neden">
              Neden burada?
            </label>
            <textarea
              id="neden"
              name="neden"
              rows={3}
              value={neden}
              onChange={(e) => setNeden(e.target.value)}
              className="w-full resize-y border border-hairline bg-[#FDFCFA] px-3 py-[11px] text-[13.5px] leading-[1.5] text-ink"
            />

            {/* AI NACE önerisi — onay olmadan sınıflandırma boş kalır */}
            <button
              type="button"
              onClick={() => setNaceOnay((v) => !v)}
              aria-pressed={naceOnay}
              className={cn(
                "mt-4 block w-full cursor-pointer border px-3 py-3 text-left",
                naceOnay ? "border-verified-line bg-verified-tint" : "tex-unverified border-dashed border-unverif-line",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn("font-mono text-[12px]", naceOnay ? "text-verified" : "text-unverif")}
                  aria-hidden
                >
                  {naceOnay ? "■" : "◌"}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[.12em]",
                    naceOnay ? "text-verified" : "text-unverif",
                  )}
                >
                  {naceOnay ? "Onayladınız · NACE 13.10" : "AI önerisi · doğrulamadınız"}
                </span>
              </span>
              <span className="mt-[7px] block text-[12.5px] leading-[1.45] text-ink-soft">
                {naceOnay
                  ? "Sınıflandırma sizin onayınızla kayda geçti. Değiştirmek için dokunun."
                  : "Yapay zekâ tanımınızdan NACE 13.10 (tekstil elyafı hazırlama ve bükme) çıkardı. Onaylamazsanız sınıflandırma boş kalır."}
              </span>
            </button>

            <div className="mt-4 border border-hairline-soft bg-paper px-3 py-3">
              <div className="font-mono text-[9.5px] uppercase tracking-[.12em] text-ink-mute">
                Kişisel veri ve gizlilik
              </div>
              <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
                Adınız kamuya açık yayımda <b>varsayılan olarak görünmez</b>. Yüklediğiniz belgelerde kişisel veri
                varsa yüklemeden önce çıkarın.
              </p>
            </div>

            {!girisYapildi && (
              <div className="mt-4 border border-unverif-line border-l-[3px] border-l-unverif bg-unverif-tint px-3 py-3 text-[13px] text-ink-soft">
                Öneri göndermek için e-posta doğrulamalı bir hesap gerekiyor. Kurum kaydı istenmez.
              </div>
            )}

            {/* Gönderim: önce benzerlik katmanı */}
            <button
              type="button"
              disabled={!hazir || bekliyor || !girisYapildi}
              onClick={benzerlikBak}
              className={cn(
                "mt-4 min-h-12 w-full border px-4 py-[15px] font-mono text-[11.5px] uppercase tracking-[.12em]",
                hazir && girisYapildi
                  ? "cursor-pointer border-ink bg-ink text-paper"
                  : "cursor-not-allowed border-[#D5D1C7] bg-hairline-soft text-[#8E959F]",
              )}
            >
              {bekliyor ? "Benzerlik kontrol ediliyor…" : "Öneriyi gönder"}
            </button>
            <p className="mt-2 text-[12px] leading-[1.45] text-ink-mute">
              Gönderim sonrası dosyanız <b>kanıt bekliyor</b> statüsüyle sisteme girer ve panonuzda görünür.
            </p>

            {/* Benzerlik katmanı — kolay yol her zaman birleştirme yolu */}
            <BenzerlikKatmani acik={benzerler !== null} kapat={() => setBenzerler(null)}>
              {benzerler && benzerler.length > 0 ? (
                <>
                  <div className="px-5 pt-[18px] pb-3.5">
                    <div className="font-mono text-[10px] uppercase tracking-[.14em] text-unverif">
                      Gönderim durduruldu · benzerlik bulundu
                    </div>
                    <div className="mt-2 font-display text-[24px] leading-[1.16]">
                      Bu öneriye çok yakın bir dosya var
                    </div>
                    <p className="mt-2 text-[13.5px] leading-[1.5] text-ink-soft">
                      Aynı konuda ikinci bir kayıt açmak ikisini de zayıf bırakır. Mevcut dosyayı güçlendirmek
                      sıralamada daha hızlı sonuç verir.
                    </p>
                    {benzerler.map((x) => (
                      <div key={x.id} className="mt-3.5 border border-hairline bg-surface p-3.5">
                        <div className="text-[14px] leading-[1.35] font-medium">{x.baslik}</div>
                        <div className="mt-2.5 flex items-center gap-2.5">
                          <EvidenceBand
                            value={x.kanit}
                            state={x.kanit >= 55 ? "verified" : "unverified"}
                            size="tablo"
                            sessiz
                          />
                          <span className="num text-[11.5px] text-ink-soft">{x.kanit}/100 kanıt</span>
                          <span className="num ml-auto text-[11.5px] text-ink-mute">{x.destek} destek</span>
                        </div>
                        <div className="mt-2.5 font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">
                          Benzerlik %{x.benzerlik} · başlık, NACE ve ilçe örtüşüyor
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 border-t border-t-hairline-soft bg-paper px-5 pt-3.5 pb-[18px]">
                    <a
                      href={`/oneri/${benzerler[0].id}`}
                      className="min-h-12 w-full border border-ink bg-ink px-4 py-3.5 text-center font-mono text-[11.5px] uppercase tracking-[.11em] text-paper"
                    >
                      Bu dosyaya destek ver ve kanıtımı ekle
                    </a>
                    <Gonder varyant="amber" className="w-full">
                      Yine de ayrı öneri olarak gönder
                    </Gonder>
                    <button
                      type="button"
                      onClick={() => setBenzerler(null)}
                      className="w-full cursor-pointer border-0 py-1.5 font-mono text-[11px] uppercase tracking-[.11em] text-ink-mute"
                    >
                      Forma dön
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-5 py-[18px]">
                  <div className="font-mono text-[10px] uppercase tracking-[.14em] text-ink-mute">
                    Benzerlik bulunamadı
                  </div>
                  <div className="mt-2 font-display text-[22px] leading-[1.16]">Öneri ayrı kayıt olarak gidiyor</div>
                  <div className="mt-3.5">
                    <Gonder className="w-full">Öneriyi gönder</Gonder>
                  </div>
                </div>
              )}
            </BenzerlikKatmani>
          </EylemFormu>
        </div>
      </div>

      {/* Kademe 2 önizleme — dosya puanı bu formdan canlı türer */}
      <div>
        <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[.14em] text-ink-mute">
          Kademe 2 · dosya güçlendirme · sıralamaya etkisi
        </div>
        <div className="border border-hairline bg-surface">
          <div className="flex items-center gap-[18px] border-b border-b-hairline-soft bg-[#FDFCFA] px-5 py-[18px]">
            <div>
              <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                Kanıt yeterliliği · aynı bant, aynı gramer
              </div>
              <div className="mt-2 flex items-center gap-3">
                <EvidenceBand
                  value={dosyaPuani}
                  state={dosyaPuani >= 55 ? "verified" : "unverified"}
                  size="oneri"
                  sessiz
                />
                <span className="num text-[26px] leading-none">{dosyaPuani}</span>
                <span className="num text-[12px] text-ink-mute">/100</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <span
                className={cn(
                  "inline-block border px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[.11em]",
                  dosyaPuani >= 55
                    ? "border-verified-line bg-verified-tint text-verified"
                    : "border-unverif-line bg-unverif-tint text-unverif",
                )}
              >
                {dosyaPuani >= 55 ? "Uzman incelemesine girebilir" : dosyaPuani >= 35 ? "Kanıt eşiği altında" : "Kanıt bekliyor"}
              </span>
              <p className="mt-2 max-w-[48ch] text-[12.5px] leading-[1.45] text-ink-soft">
                {dosyaPuani >= 55
                  ? `Bu dosya sıralamaya girebilir. Kanıt yeterliliği ${dosyaPuani}/100 — eşik 55.`
                  : `Bu öneri şu an kanıt yeterliliği düşük (${dosyaPuani}/100, eşik 55). Eksikleri tamamlarsanız uzman incelemesine girer.`}
              </p>
            </div>
          </div>

          <div className="px-5 pt-1.5 pb-3.5">
            {adimlar.map((a) => (
              <div
                key={a.ad}
                className={cn(
                  "mt-2.5 grid grid-cols-[22px_1fr_168px] items-center gap-3 border border-hairline-soft px-3 py-3",
                  a.tam
                    ? "border-l-[3px] [border-left-style:solid] border-l-verified bg-surface"
                    : "tex-unverified border-l-[3px] [border-left-style:dashed] border-l-unverif-line",
                )}
              >
                <span className={cn("font-mono text-[13px]", a.tam ? "text-verified" : "text-unverif")} aria-hidden>
                  {a.tam ? "■" : "□"}
                </span>
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{a.ad}</div>
                  <div className="mt-[3px] font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    {a.puan >= 22 ? "Dosya güçlendirme" : "Hızlı öneri"}
                  </div>
                </div>
                <div
                  className={cn(
                    "num text-right text-[11px] tracking-[.06em]",
                    a.tam ? "text-verified" : "text-unverif",
                  )}
                >
                  {a.tam ? `tamam · +${a.puan} puan` : `eklerseniz +${a.puan} puan`}
                </div>
              </div>
            ))}
            <p className="mt-3.5 text-[12px] leading-[1.45] text-ink-mute">
              Son üç adım kanıt kartı ister; öneriyi gönderdikten sonra dosya sayfasından eklenir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
