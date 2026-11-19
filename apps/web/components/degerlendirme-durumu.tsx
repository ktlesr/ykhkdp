"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { OtoYenile } from "./oto-yenile.tsx";
import { Isaret } from "./ui.tsx";
import { degerlendirEylemi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Değerlendirme koşusu — arka plandaki AI işinin canlı göstergesi.
 *
 * Her şey SUNUCUDAN gelir: `oneri.asama` + `asama_zamani` (migration 0016),
 * `deneme`, `son_hata`. Uydurma yüzde ya da tahmini süre yok; hareket yalnızca
 * "bu adım şu an sürüyor" demek. Sayfa 4 saniyede bir sunucudan tazelenir.
 *
 * Ayırt edilen durumlar (Codex ile birlikte, canlılık açığı kapatılarak):
 *   sırada        aşama yok, hata yok
 *   çalışıyor     aşama var, hata yok, son adım TAKILMA_SINIRI içinde
 *   takıldı       aşama var, hata yok ama uzun süredir adım değişmedi (süreç çökmüş olabilir)
 *   durdu         son_hata var, deneme hakkı kaldı — sıradaki tur yeniden dener
 *   tükendi       son_hata var, deneme hakkı bitti
 * Hata ve takılmada hareket durur.
 */

export const ADIMLAR = [
  { id: "alindi", ad: "Kuyruktan alındı", aciklama: "Öneri değerlendirme kuyruğundan alındı." },
  { id: "nace", ad: "NACE kodu", aciklama: "Kod girilmediyse aday listesinden atanıyor." },
  { id: "belge", ad: "Belge paketi", aciklama: "İle, ajansa ve ulusala ait plan parçaları seçiliyor." },
  { id: "model", ad: "Puanlama", aciklama: "Sekiz kriter puanlanıyor; her alıntı belgede birebir aranıyor." },
  { id: "karsi_gorus", ad: "Karşı görüş", aciklama: "Aynı belgelerle önerinin aleyhine en güçlü itiraz aranıyor." },
  { id: "kayit", ad: "Kayıt", aciklama: "Doğrulanan çıktı taslak puan olarak kaydediliyor." },
] as const;

type AdimId = (typeof ADIMLAR)[number]["id"];
const TAKILMA_SINIRI_SN = 10 * 60;

export function DegerlendirmeDurumu({
  oneriId,
  deneme,
  maksDeneme,
  sonHata,
  asama,
  asamaZamani,
  naceAtlandi,
  tetikleyebilir,
}: {
  oneriId: number;
  deneme: number;
  maksDeneme: number;
  sonHata: string | null;
  asama: string | null;
  asamaZamani: string | null;
  /** yatırımcı NACE kodunu kendisi girdi — adım çalışmaz, "atlandı" görünür */
  naceAtlandi: boolean;
  tetikleyebilir: boolean;
}) {
  const router = useRouter();
  // Saat yalnızca istemcide işler: sunucu render'ında "şimdi" yok → hydration güvenli.
  const [simdi, setSimdi] = useState<number | null>(null);

  useEffect(() => {
    setSimdi(Date.now());
    const saat = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(saat);
  }, []);

  const aktif = (ADIMLAR.find((a) => a.id === asama)?.id ?? null) as AdimId | null;
  const aktifSira = aktif ? ADIMLAR.findIndex((a) => a.id === aktif) : -1;
  const yas = asamaZamani && simdi ? Math.max(0, Math.round((simdi - Date.parse(asamaZamani)) / 1000)) : null;

  const durum: "sirada" | "calisiyor" | "takildi" | "durdu" | "tukendi" = sonHata
    ? deneme >= maksDeneme
      ? "tukendi"
      : "durdu"
    : aktif
      ? yas !== null && yas > TAKILMA_SINIRI_SN
        ? "takildi"
        : "calisiyor"
      : "sirada";
  const hareketli = durum === "calisiyor";

  const BASLIK = {
    sirada: "Sırada bekliyor",
    calisiyor: "Değerlendiriliyor",
    takildi: "İlerleme durdu görünüyor",
    durdu: "Bu deneme tamamlanmadı",
    tukendi: "Değerlendirme durdu",
  }[durum];

  const ALT = {
    sirada: tetikleyebilir
      ? "Öneri kuyrukta. Arka plan işleyicisi alınca adımlar burada ilerler."
      : "Öneri kuyrukta. Değerlendirmeyi ajans yürütür; adımlar burada ilerler.",
    calisiyor: aktif ? ADIMLAR[aktifSira].aciklama : "",
    takildi:
      "Son adım uzun süredir değişmedi; işleyici yeniden başlamış olabilir. Öneri kuyrukta kalır ve yeniden alınır.",
    durdu: `Deneme ${deneme}/${maksDeneme} tamamlanmadı; sıradaki turda yeniden denenecek.`,
    tukendi: `${maksDeneme} deneme tamamlanmadı. Ajans nedeni inceleyip yeniden başlatabilir.`,
  }[durum];

  function adimDurumu(i: number, id: AdimId): "tamam" | "aktif" | "hata" | "atlandi" | "bekliyor" {
    if (id === "nace" && naceAtlandi) return "atlandi";
    if (aktifSira < 0) return "bekliyor";
    if (i < aktifSira) return "tamam";
    if (i === aktifSira) return sonHata ? "hata" : "aktif";
    return "bekliyor";
  }

  return (
    <section
      aria-labelledby="degerlendirme-baslik"
      className="mt-8 border border-hairline border-l-[3px] border-l-unverif [border-left-style:dashed] bg-surface"
    >
      {/* Sekme arka plandayken tarayıcı zamanlayıcıyı dakikada bire indirir; ortak
          bileşen sekmeye dönülünce HEMEN tazeler (koşu bitmişse sonuç beklemeden görünür). */}
      <OtoYenile aktif />
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-5 pt-5">
        <div className="min-w-0">
          <h2 id="degerlendirme-baslik" className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-.01em] text-ink">
            <span aria-hidden className={cn("num text-[13px] text-unverif", hareketli && "analiz-nabiz")}>
              ◌
            </span>
            {BASLIK}
          </h2>
          {/* Ekran okuyucu adım değişimini duyar. */}
          <p aria-live="polite" className="mt-1 max-w-[62ch] text-[13.5px] leading-[1.5] text-ink-soft">
            {ALT}
          </p>
        </div>
        <dl className="flex shrink-0 gap-5 text-right">
          {/* "0/3" ilerleme gibi okunuyordu; yalnızca gerçek bir deneme varsa yazılır. */}
          {deneme > 0 && (
            <div>
              <dt className="etiket text-ink-mute">Deneme</dt>
              <dd className="mt-0.5 text-[13.5px] text-ink">
                <span className="num">{deneme}</span>. deneme · en çok <span className="num">{maksDeneme}</span>
              </dd>
            </div>
          )}
          {aktif && (
            <div>
              <dt className="etiket text-ink-mute">Son adım</dt>
              <dd className="num mt-0.5 text-[14px] text-ink">{yas === null ? "—" : sureYaz(yas)} önce</dd>
            </div>
          )}
        </dl>
      </div>

      <ol className="mt-5 border-t border-t-hairline-soft">
        {ADIMLAR.map((a, i) => {
          const d = adimDurumu(i, a.id);
          const etkin = d === "aktif" || d === "hata";
          return (
            <li
              key={a.id}
              aria-current={d === "aktif" ? "step" : undefined}
              className={cn(
                "relative grid grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-x-3 border-b border-b-hairline-soft py-3 pr-5 last:border-b-0",
                d === "aktif" && hareketli && "analiz-tarama bg-navy-tint/60",
                d === "hata" && "bg-conflict-tint/50",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "num flex h-[22px] items-center justify-center text-[11px]",
                  d === "tamam" && "analiz-tamam text-ink",
                  d === "aktif" && cn("text-navy", hareketli && "analiz-nabiz"),
                  d === "hata" && "text-conflict",
                  (d === "bekliyor" || d === "atlandi") && "text-ink-mute",
                )}
              >
                {d === "tamam" || d === "aktif" ? "■" : d === "hata" ? <Isaret ad="hata" className="size-[13px]" /> : d === "atlandi" ? "—" : "□"}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-[14px] leading-[22px] font-medium",
                    d === "bekliyor" || d === "atlandi" ? "text-ink-mute" : "text-ink",
                  )}
                >
                  {a.ad}
                </div>
                {(etkin || d === "atlandi") && (
                  <div className="mt-0.5 text-[12.5px] leading-[1.45] text-ink-soft">
                    {d === "atlandi" ? "NACE kodunu yatırımcı girdi; atama yapılmadı." : a.aciklama}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "etiket pt-[3px] text-right",
                  d === "aktif" ? "text-navy" : d === "hata" ? "text-conflict" : "text-ink-mute",
                )}
              >
                {d === "tamam" && "Tamamlandı"}
                {d === "aktif" && (hareketli ? "Sürüyor" : "Bekliyor")}
                {d === "hata" && "Burada durdu"}
                {d === "atlandi" && "Atlandı"}
                {d === "bekliyor" && "Sırada"}
              </span>
            </li>
          );
        })}
      </ol>

      {sonHata && (
        <div className="flex gap-3 border-t border-t-hairline-soft bg-conflict-tint/60 px-5 py-3.5">
          <Isaret ad="hata" className="mt-[2px] text-conflict" />
          <div className="min-w-0 text-[13px] leading-[1.5] text-ink-soft">
            <div className="text-[13.5px] font-semibold text-ink">Son hata</div>
            <div className="mt-0.5 break-words">{sonHata}</div>
          </div>
        </div>
      )}

      {tetikleyebilir && durum !== "calisiyor" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-t-hairline-soft px-5 py-4">
          <p className="max-w-[60ch] text-[13px] leading-[1.5] text-ink-soft">
            {durum === "sirada"
              ? "İşleyici çalışmıyorsa öneri hiç alınmaz. Beklemek yerine şimdi başlatabilirsiniz."
              : "Ajans olarak değerlendirmeyi şimdi yeniden başlatabilirsiniz; aynı kuralla doğrulanır."}
          </p>
          <EylemFormu eylem={degerlendirEylemi} onSonuc={() => router.refresh()}>
            <input type="hidden" name="oneriId" value={oneriId} />
            <Gonder bekleme="Başlatılıyor">
              {durum === "sirada" ? "Şimdi değerlendir" : "Yeniden değerlendir"}
            </Gonder>
          </EylemFormu>
        </div>
      )}
    </section>
  );
}

function sureYaz(sn: number): string {
  const dk = Math.floor(sn / 60);
  const s = sn % 60;
  return dk ? `${dk} dk ${String(s).padStart(2, "0")} sn` : `${s} sn`;
}

/**
 * Listelerde (onay kuyruğu, önerilerim) tek satırlık canlı aşama işareti.
 * Aynı sunucu kaynağı: `oneri.asama`. Liste sayfası kendini tazelemez; rozet
 * yalnızca o anki adımı söyler.
 */
export function AsamaRozeti({ asama, hatali }: { asama: string | null; hatali: boolean }) {
  const adim = ADIMLAR.find((a) => a.id === asama);
  const metin = hatali ? "Deneme tamamlanmadı" : adim ? `${adim.ad} sürüyor` : "Sırada";
  return (
    <span
      className={cn(
        "relative inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden rounded-[2px] border px-2 py-[3px] text-[12px] font-medium",
        hatali
          ? "border-conflict-line bg-conflict-tint text-conflict"
          : "border-unverif-line bg-unverif-tint text-unverif [border-style:dashed]",
        adim && !hatali && "analiz-tarama",
      )}
    >
      <span aria-hidden className={cn("num text-[11px]", adim && !hatali && "analiz-nabiz")}>
        {hatali ? <Isaret ad="hata" className="size-3" /> : "◌"}
      </span>
      {metin}
    </span>
  );
}
