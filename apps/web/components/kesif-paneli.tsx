"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { KesifDurumu } from "@ykh/database";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { OneriFormu, type Taslak } from "./oneri-formu.tsx";
import { Bag, Isaret } from "./ui.tsx";
import { kesifEylemi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";

/**
 * İl ekranında iki araç — ikisi de mevcut değerlendirme hattına öneri sokar,
 * ikisi de ajans onayı olmadan sıralamaya hiçbir şey sokmaz:
 *
 *  · Belgelerden aday keşfi: bütün parçalar taranır, adaylar yerel kanıtla çıkar.
 *  · Konu puanla: verilen başlık ve açıklama aynı sekiz kriterle puanlanır.
 */

const ADIMLAR = [
  { id: "envanter", ad: "Belge envanteri", aciklama: "İle, ajansa ve ulusala ait bütün belge parçaları sayılıyor." },
  { id: "tarama", ad: "Kanıt taraması", aciklama: "Her parça bir kez okunuyor; pasajlar kaynakta birebir doğrulanıyor." },
  { id: "aday", ad: "Aday çıkarımı", aciklama: "Adaylar yalnızca doğrulanmış kanıtlara atıfla, en az biri yerel." },
  { id: "kayit", ad: "Değerlendirmeye alma", aciklama: "Adaylar sekiz kriterle ayrıca puanlanmak üzere kuyruğa giriyor." },
] as const;

export function KesifPaneli({ il, kesif }: { il: string; kesif: KesifDurumu | null }) {
  const router = useRouter();
  const surer = kesif?.durum === "bekliyor" || kesif?.durum === "calisiyor";

  useEffect(() => {
    if (!surer) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [surer, router]);

  const aktif = kesif?.durum === "calisiyor" ? ADIMLAR.findIndex((a) => a.id === kesif.asama) : -1;
  const oran = kesif && kesif.toplam_parca ? Math.round((kesif.taranan_parca / kesif.toplam_parca) * 100) : 0;

  return (
    <section
      aria-labelledby="kesif-baslik"
      className={cn(
        "border border-hairline bg-surface",
        surer && "border-l-[3px] border-l-navy",
        kesif?.durum === "hata" && "border-l-[3px] border-l-conflict",
      )}
    >
      <div className="serit flex items-center justify-between gap-3 px-4 py-2.5 etiket text-ink-soft">
        <span>Belgelerden aday keşfi</span>
        {kesif && <span className="num text-ink-mute">{kesif.tarih}</span>}
      </div>

      <div className="px-4 py-4">
        <h2 id="kesif-baslik" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-.01em] text-ink">
          {surer && <span aria-hidden className="num text-[13px] text-navy analiz-nabiz">◌</span>}
          {!kesif
            ? "Yüklü belgelerden yatırım konusu adayı çıkar"
            : kesif.durum === "bekliyor"
              ? "Keşif sırada"
              : kesif.durum === "calisiyor"
                ? "Belgeler taranıyor"
                : kesif.durum === "tamam"
                  ? "Son keşif tamamlandı"
                  : "Son keşif tamamlanmadı"}
        </h2>
        <p aria-live="polite" className="mt-1 max-w-[68ch] text-[13px] leading-[1.55] text-ink-soft text-pretty">
          {kesif?.mesaj ??
            (kesif?.durum === "bekliyor"
              ? "Arka plan işleyicisi alınca adımlar burada ilerler."
              : surer
                ? ADIMLAR[Math.max(aktif, 0)].aciklama
                : "İle, ajansa ve ulusala ait bütün parçalar taranır. Aday ancak en az iki doğrulanmış kanıta, biri bu ile özgü olmak üzere, dayanırsa çıkar; her aday ayrıca sekiz kriterle puanlanır ve onayınızı bekler.")}
        </p>

        {surer && (
          <ol className="mt-4 border-t border-t-hairline-soft">
            {ADIMLAR.map((a, i) => {
              const d = aktif < 0 ? "bekliyor" : i < aktif ? "tamam" : i === aktif ? "aktif" : "bekliyor";
              return (
                <li
                  key={a.id}
                  aria-current={d === "aktif" ? "step" : undefined}
                  className={cn(
                    "grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-b-hairline-soft py-2.5 last:border-b-0",
                    d === "aktif" && "analiz-tarama bg-navy-tint/60",
                  )}
                >
                  <span aria-hidden className={cn("num text-[11px]", d === "aktif" ? "text-navy analiz-nabiz" : d === "tamam" ? "text-ink" : "text-ink-mute")}>
                    {d === "bekliyor" ? "□" : "■"}
                  </span>
                  <span className={cn("text-[13.5px] font-medium", d === "bekliyor" ? "text-ink-mute" : "text-ink")}>{a.ad}</span>
                  <span className={cn("etiket", d === "aktif" ? "text-navy" : "text-ink-mute")}>
                    {a.id === "tarama" && kesif && kesif.toplam_parca > 0 && d !== "bekliyor" ? (
                      <span className="num">
                        {kesif.taranan_parca}/{kesif.toplam_parca} parça
                      </span>
                    ) : d === "tamam" ? (
                      "Tamamlandı"
                    ) : d === "aktif" ? (
                      "Sürüyor"
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {surer && kesif && kesif.toplam_parca > 0 && (
          <div className="mt-3 h-[3px] bg-hairline-soft" role="progressbar" aria-valuenow={oran} aria-valuemin={0} aria-valuemax={100} aria-label="Taranan parça oranı">
            <div className="h-full bg-navy transition-[width] duration-500" style={{ width: `${oran}%` }} />
          </div>
        )}

        {kesif && !surer && kesif.toplam_parca > 0 && (
          <dl className="mt-4 grid grid-cols-4 border border-hairline-soft max-[640px]:grid-cols-2">
            {[
              { e: "Taranan parça", v: `${kesif.taranan_parca}/${kesif.toplam_parca}` },
              { e: "Doğrulanmış kanıt", v: kesif.kanit_sayisi },
              { e: "Bu ile özgü", v: kesif.yerel_kanit },
              { e: "Aday", v: kesif.aday_sayisi },
            ].map((x, i) => (
              <div key={x.e} className={cn("px-3 py-2.5", i % 4 !== 3 && "border-r border-r-hairline-soft max-[640px]:odd:border-r max-[640px]:even:border-r-0")}>
                <dt className="etiket text-ink-mute">{x.e}</dt>
                <dd className="num mt-0.5 text-[18px] text-ink">{x.v}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {!surer && (
            <EylemFormu eylem={kesifEylemi} onSonuc={(s) => s.ok && router.refresh()}>
              <input type="hidden" name="il" value={il} />
              <Gonder bekleme="Sıraya alınıyor">{kesif ? "Keşfi yeniden başlat" : "Aday keşfini başlat"}</Gonder>
            </EylemFormu>
          )}
          {kesif && kesif.aday_sayisi > 0 && <Bag href="/onay">Adayları onay kuyruğunda gör</Bag>}
          {kesif?.durum === "hata" && (
            <span className="inline-flex items-center gap-1.5 etiket text-conflict">
              <Isaret ad="hata" className="size-[12px]" /> Taranmış parçalar saklanır; yeniden başlatınca kalanlardan devam eder.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Konu puanla — başlık ve "neden burada?" açıklaması verilen konu, yatırımcı
 * önerisiyle AYNI hattan puanlanır: stratejik puan (sekiz kriter, dönemin
 * ağırlık seti) ve belge dayanağı (kaydedilen her alıntı belgede birebir).
 * Sonuç öneri kaydı ekranında, canlı ilerlemeyle açılır.
 */
export function KonuPuanla({ il, yerellikPayi }: { il: { kod: string; ad: string; ilceler: string[] }; yerellikPayi: number }) {
  const [taslak, setTaslak] = useState<Taslak>({ baslik: "", gerekce: "", ilce: "", nace: null });
  return (
    <section aria-labelledby="puanla-baslik" className="border border-hairline bg-surface">
      <div className="serit px-4 py-2.5 etiket text-ink-soft">Konu puanla</div>
      <div className="px-4 pt-4">
        <h2 id="puanla-baslik" className="text-[16px] font-semibold tracking-[-.01em] text-ink">
          Bir yatırım konusunu belgelere göre puanlat
        </h2>
        <p className="mt-1 max-w-[68ch] text-[13px] leading-[1.55] text-ink-soft text-pretty">
          Başlığı ve bu ilde neden yapılması gerektiğini yazın. Konu, yatırımcı önerileriyle aynı sekiz kriterle puanlanır ve
          yüklü belgelere bağlanır; belgede birebir geçmeyen alıntı kaydedilmez. Sonuç onayınızı bekler.
        </p>
      </div>
      <OneriFormu il={il} yerellikPayi={yerellikPayi} taslak={taslak} setTaslak={setTaslak} ajansModu />
    </section>
  );
}
