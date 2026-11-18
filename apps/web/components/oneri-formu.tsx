"use client";

import { useState, useTransition } from "react";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { NaceSecici, type Kayit } from "./nace-secici.tsx";
import { ALAN_ETIKET, DUGME_STIL, DUGME_TABAN, GIRDI } from "./ui.tsx";
import { oneriEylemi, uygunlukEylemi, type UygunlukCevabi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";

const KARAR: Record<UygunlukCevabi["karar"], { ad: string; renk: string }> = {
  uygun: { ad: "Belgelere göre uygun", renk: "border-l-navy" },
  kismen: { ad: "Kısmen uygun · çekince var", renk: "border-l-unverif" },
  uygun_degil: { ad: "Belgelere göre uygun değil", renk: "border-l-conflict" },
  baglanamadi: { ad: "Gerekçe belgelere bağlanamadı", renk: "border-l-conflict" },
  kanit_yok: { ad: "Belgelerde bu konu geçmiyor", renk: "border-l-conflict" },
  taranmadi: { ad: "Belgeler henüz taranmamış", renk: "border-l-unverif" },
  hata: { ad: "Analiz yapılamadı", renk: "border-l-conflict" },
};

/**
 * Yalnızca başlıkla uygunluk analizi (ajans). Sonuç bir TASLAKTIR: uygunsa
 * hazırlanan gerekçe forma aktarılır ve konu normal yoldan puanlanır.
 */
function UygunlukAnalizi({ il, baslik, aktar }: { il: { kod: string; ad: string }; baslik: string; aktar: (metin: string) => void }) {
  const [sonuc, setSonuc] = useState<UygunlukCevabi | null>(null);
  const [surer, basla] = useTransition();
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={surer || baslik.trim().length < 8}
          onClick={() => basla(async () => setSonuc(await uygunlukEylemi(il.kod, baslik)))}
          className={cn(DUGME_TABAN, DUGME_STIL.cizgi)}
        >
          {surer ? "Belgelere bakılıyor…" : "Yalnızca başlıkla uygunluğu analiz et"}
        </button>
        <span className="max-w-[46ch] text-[12px] leading-[1.45] text-ink-mute">
          Gerekçe yazmadan: {il.ad} belgelerinden çıkarılmış kanıtlara göre konu uygun mu, uygunsa gerekçesi ne?
        </span>
      </div>
      {sonuc && !surer && (
        <div aria-live="polite" className={cn("mt-3 border border-hairline border-l-[3px] bg-paper px-3.5 py-3", KARAR[sonuc.karar].renk)}>
          <div className="etiket text-ink">{KARAR[sonuc.karar].ad} · taslak, puan değil</div>
          {sonuc.neden && <p className="mt-1.5 max-w-[72ch] text-[13px] leading-[1.5] text-ink-soft text-pretty">{sonuc.neden}</p>}
          {sonuc.gerekce && (
            <>
              <div className="mt-3 etiket text-ink-mute">Hazırlanan gerekçe · belgede yazan</div>
              <p className="mt-1 max-w-[72ch] text-[13px] leading-[1.5] text-ink text-pretty">{sonuc.gerekce}</p>
            </>
          )}
          {sonuc.sentez && (
            <>
              <div className="mt-3 etiket text-ink-mute">Yapay zekâ çıkarımı · belgede yazmaz</div>
              <p className="mt-1 max-w-[72ch] text-[13px] leading-[1.5] text-ink-soft text-pretty">{sonuc.sentez}</p>
            </>
          )}
          {sonuc.kanitlar.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer etiket text-ink-mute hover:text-ink">
                Dayanılan pasajlar · <span className="num">{sonuc.kanitlar.length}</span>
              </summary>
              <ul className="mt-2 border-t border-t-hairline-soft">
                {sonuc.kanitlar.map((k) => (
                  <li key={k.alinti} className="border-b border-b-hairline-soft py-2 text-[12.5px] leading-[1.5] text-ink-soft">
                    <span className="text-ink">&ldquo;{k.alinti}&rdquo;</span>
                    <span className="mt-0.5 block text-ink-mute">
                      {k.belge}
                      {k.bolum ? ` · ${k.bolum}` : ""}
                      {k.yerel ? " · bu ile özgü" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {sonuc.taslak && (
            <button type="button" onClick={() => aktar(sonuc.taslak)} className={cn(DUGME_TABAN, DUGME_STIL.dolu, "mt-3")}>
              Gerekçeyi forma aktar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Öneri formu — sihirbazın son adımı. Tüm dokunma hedefleri ≥44px.
 *
 * İl artık formda seçilmiyor: sihirbaz seçti ve gizli alan olarak taşınıyor.
 * Eskiden il seçimi `router.replace` ile sayfayı yeniden yüklüyor ve yazılmış
 * metni riske atıyordu; o yol kalktı.
 */
export type Taslak = { baslik: string; gerekce: string; ilce: string; nace: Kayit | null; kapsam?: string };

/**
 * Taslak üst bileşende (sihirbaz) tutulur: il değiştirmek için geri dönmek bu
 * formu unmount ediyor ve yerel state yazılmış metni siliyordu.
 */
export function OneriFormu({
  il,
  yerellikPayi,
  taslak,
  setTaslak,
  ajansModu = false,
}: {
  il: { kod: string; ad: string; ilceler: string[] };
  yerellikPayi: number;
  taslak: Taslak;
  setTaslak: (t: Taslak) => void;
  /** il ekranındaki "konu puanla": aynı form, ajansın kendi sorusu — gizlilik notu yatırımcıya ait */
  ajansModu?: boolean;
}) {
  const { baslik, gerekce } = taslak;
  const setBaslik = (v: string) => setTaslak({ ...taslak, baslik: v });
  const setGerekce = (v: string) => setTaslak({ ...taslak, gerekce: v });
  // İl değiştiyse önceki ilin ilçesi geçersiz: il düzeyine düşer.
  const ilce = il.ilceler.includes(taslak.ilce) ? taslak.ilce : "";

  return (
    <EylemFormu eylem={oneriEylemi} className={ajansModu ? "" : "mt-6 border border-ink bg-surface"}>
      {!ajansModu && (
        <div className="serit flex items-center justify-between px-4 py-2.5 etiket text-ink-soft">
          <span>Öneri formu</span>
          <span>{il.ad}</span>
        </div>
      )}

      <div className="px-4 py-5">
        <label className={ALAN_ETIKET} htmlFor="baslik">
          Yatırım konusu başlığı
        </label>
        <input
          id="baslik"
          name="baslik"
          value={baslik}
          onChange={(e) => setBaslik(e.target.value)}
          placeholder="Örnek: Tekstil kırpıklarından geri dönüştürülmüş elyaf"
          className={GIRDI}
          required
          minLength={8}
        />
        {ajansModu && <UygunlukAnalizi il={il} baslik={baslik} aktar={setGerekce} />}

        <div className="mt-5">
          <label className={ALAN_ETIKET} htmlFor="gerekce">
            Neden burada? · en ağır soru
          </label>
          <textarea
            id="gerekce"
            name="gerekce"
            rows={5}
            value={gerekce}
            onChange={(e) => setGerekce(e.target.value)}
            placeholder="Hangi yerel kaynak, hangi mevcut sanayi, hangi arazi-enerji-işgücü donanımı bu konuyu burada mümkün kılıyor?"
            className="w-full resize-y border border-ink bg-alan px-3 py-[11px] text-[13.5px] leading-[1.5] text-ink"
            required
            minLength={40}
          />
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <p className="max-w-[62ch] text-[12px] leading-[1.45] text-ink-soft">
              Puanın en büyük payı (<b>%{yerellikPayi}</b>) bu cevaba ait. Aynı konu başka bir ilde de aynı şekilde
              yapılabiliyorsa gerekçe zayıf kalır.
            </p>
            <span className="num shrink-0 text-[10px] text-ink-mute">{gerekce.length} karakter</span>
          </div>
        </div>

        <input type="hidden" name="il" value={il.kod} />

        {/* İlçe verisi yüklenmemiş illerde alan HİÇ sorulmaz: uydurma ilçe adı
            yazdırmak yerine öneri il düzeyinde kaydedilir. */}
        {il.ilceler.length > 0 ? (
          <div className="mt-5 max-w-[320px]">
            <label className={ALAN_ETIKET} htmlFor="ilce">
              İlçe · {il.ad}
            </label>
            <select
              id="ilce"
              name="ilce"
              className={GIRDI}
              value={ilce}
              onChange={(e) => setTaslak({ ...taslak, ilce: e.target.value })}
            >
              {/* Bilinçli seçim yoksa öneri il düzeyinde kaydedilir (`ilce` null);
                  ilk ilçeyi varsayılan yapmak seçilmemiş bir ilçe yazıyordu. */}
              <option value="">İl düzeyi · ilçe belirtmeden</option>
              {il.ilceler.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="mt-5 border border-hairline-soft bg-paper px-3.5 py-3 text-[12.5px] leading-[1.45] text-ink-soft">
            {il.ad} için ilçe listesi henüz yüklenmemiş. Öneriniz il düzeyinde kaydedilir; ilçe ayrıntısını
            &ldquo;neden burada?&rdquo; gerekçesinde yazabilirsiniz.
          </p>
        )}

        {/* Ürün grupları — isteğe bağlı. Konu bir ürün ailesiyse gruplar burada;
            dar ama güçlü dayanaklı konu için boş bırakılır. */}
        <div className="mt-5">
          <label className={ALAN_ETIKET} htmlFor="kapsam">
            Ürün grupları · isteğe bağlı
          </label>
          <textarea
            id="kapsam"
            name="kapsam"
            rows={3}
            value={taslak.kapsam ?? ""}
            onChange={(e) => setTaslak({ ...taslak, kapsam: e.target.value })}
            placeholder={"Her satıra bir grup, en çok 8. Örnek:\nEmniyet sistemleri (emniyet kemeri, hava yastığı)\nHafif yapısal bileşenler"}
            className="w-full resize-y border border-ink bg-alan px-3 py-[11px] text-[13.5px] leading-[1.5] text-ink"
          />
          <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-[1.45] text-ink-soft">
            Konu tek bir ürün değil de ilin kabiliyetine dayanan bir ürün ailesiyse ürün gruplarını yazın. Grup sayısı puanı
            kendiliğinden artırmaz; puanı gerekçe ve belge dayanağı belirler.
          </p>
        </div>

        <div className="mt-5">
          <NaceSecici secili={taslak.nace} degisti={(nace) => setTaslak({ ...taslak, nace })} />
        </div>

        {!ajansModu && (
        <div className="mt-5 border border-hairline-soft bg-paper px-3.5 py-3">
          <div className="etiket text-ink-mute">Gizlilik</div>
          <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
            Adınız kamuya açık listede <b>görünmez</b>. Silme talebinizde kimliğiniz silinir, öneriniz takma anahtarla
            kalır.
          </p>
        </div>
        )}

        <div className="mt-5">
          <Gonder className="w-full">
            {ajansModu ? `Konuyu puanlat · ${il.ad}` : `Öneriyi değerlendirmeye gönder · ${il.ad}`}
          </Gonder>
        </div>
        <p className="mt-2 text-[12px] leading-[1.45] text-ink-mute">
          {ajansModu
            ? "Puanlama ilerlemesi kayıt ekranında canlı görünür: stratejik puan, belge dayanağı ve her kriterin alıntısı."
            : "Gönderdikten sonra yapay zekâ değerlendirir. Puan hazır olduğunda ajans onayına düşer."}
        </p>
      </div>
    </EylemFormu>
  );
}
