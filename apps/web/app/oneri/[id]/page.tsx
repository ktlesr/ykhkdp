import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { oneriGetir, donemGetir } from "@ykh/database";
import {
  KARSI_GORUS_ETIKET,
  NACE_KAYNAK_ETIKET,
  ONERI_DURUM_ACIKLAMA,
  ONERI_DURUM_ETIKET,
  onaylayabilir,
  type KarsiGorusTuru,
} from "@ykh/domain";
import { GRUP_ACIKLAMA, GRUP_ETIKET, gruplaraGore, KRITER_ETIKET, type Kriter } from "@ykh/scoring";
import { Bag, Baslik, Rozet, Sayfa, UstBar, Uyari } from "@/components/ui.tsx";
import { OnayKutusu } from "@/components/onay-kutusu.tsx";
import { DegerlendirmeDurumu } from "@/components/degerlendirme-durumu.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { KAPALI } from "@/lib/site.ts";
import { cn } from "@/lib/utils.ts";

/** Öneri detayı — AI bu puanı neye dayanarak verdi. */
/**
 * ARAMA MOTORUNA VE PAYLAŞIM KARTINA KAPALI.
 *
 * Bu ekran öneri verisi taşıyor ya da ona götürüyor. Başlık sabit ve
 * içerikten türemiyor: dinamik bir başlık (ör. önerinin kendi adı) sekme
 * adında, tarayıcı geçmişinde ve paylaşılan bir bağlantının önizlemesinde
 * görünürdü — RLS ile kapattığımız şey oradan sızardı.
 */
export const metadata: Metadata = { title: "Öneri kaydı", robots: KAPALI };

export default async function OneriDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await baglam();
  const k = await kullanici();

  const o = await oneriGetir(b, Number(id));
  if (!o) notFound();
  const d = await donemGetir(b, o.il_kod, o.yil);
  if (!d) notFound();

  const puanlar = o.puanlar ?? null;
  const ajans = Boolean(k && onaylayabilir(k.rol));

  /**
   * RLS yatırımcıya iki şey gösteriyor: kendi önerileri ve `koken = 'mevcut'`
   * resmî konular. İkincisi burada kapatılıyor — resmî konunun platform
   * değerlendirmesi ajansın çalışmasıdır ve yatırımcıya gerekmez. Tanıtım
   * sayfası tek bir örneği kendi içinde açar; gezinilecek bir küme değil.
   */
  if (!ajans && o.koken === "mevcut") notFound();
  const durumTuru = { listede: "yesil", onay_bekliyor: "amber", degerlendiriliyor: "notr", reddedildi: "kirmizi" } as const;
  const alintilar = o.alintilar ?? [];
  const kriterDayanagi = o.kriter_dayanagi ?? null;
  const karsiGorus = o.karsi_gorus ?? [];

  return (
    <>
      <UstBar
        kullanici={k}
        // İller ve il sıralaması ajans ekranı; yatırımcı oraya gidince /oneri'ye
        // yönlendirilirdi — bağlantıyı hiç göstermiyoruz.
        nav={[
          ...(ajans ? [{ ad: "İller", yol: "/iller" }] : []),
          ...(ajans
            ? [
                { ad: o.il, yol: `/il/${o.il_kod}` },
                { ad: "Onay", yol: "/onay" },
              ]
            : [{ ad: "Öneri ver", yol: "/oneri" }, { ad: "Önerilerim", yol: "/onerilerim" }]),
        ]}
      />
      <Sayfa genis>
        <Baslik ustEtiket={[o.il, `${o.yil} dönemi`, o.ilce].filter(Boolean).join(" · ")}>{o.baslik}</Baslik>

        {/* Rapor düzeni: solda değerlendirme gövdesi, sağda sabit künye ve ajans kararı. */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_340px] items-start gap-10 max-[1040px]:grid-cols-1 max-[1040px]:gap-6">
        <div className="min-w-0">

        {(puanlar || o.durum !== "degerlendiriliyor" || o.nace_kod || o.duzeltildi) && (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          {/* Değerlendirme sürerken durumu TEK yer söyler: aşağıdaki canlı panel. */}
          {(puanlar || o.durum !== "degerlendiriliyor") && (
            <Rozet tur={durumTuru[o.durum]} isaret={o.durum === "listede" ? "■" : o.durum === "reddedildi" ? "▼" : "◌"}>
              {ONERI_DURUM_ETIKET[o.durum]}
            </Rozet>
          )}
          {o.nace_kod && (
            <Rozet tur={o.nace_kaynagi === "ai" ? "amber" : "notr"}>
              NACE {o.nace_kod} · {o.nace_kaynagi ? NACE_KAYNAK_ETIKET[o.nace_kaynagi] : ""}
            </Rozet>
          )}
          {o.duzeltildi && <Rozet tur="notr">Puan ajans tarafından düzeltildi</Rozet>}
        </div>
        )}

        {(puanlar || o.durum !== "degerlendiriliyor") && (
          <p className="text-[13px] leading-[1.5] text-ink-soft">{ONERI_DURUM_ACIKLAMA[o.durum]}</p>
        )}

        {o.nace_kod && o.nace_tanim && (
          <p className="mt-1.5 text-[12.5px] text-ink-mute">
            <span className="num">{o.nace_kod}</span> — {o.nace_tanim}
          </p>
        )}

        {o.durum === "reddedildi" && o.ret_gerekcesi && (
          <Uyari tur="kirmizi">
            <b className="font-semibold text-conflict">Ret gerekçesi:</b> {o.ret_gerekcesi}
          </Uyari>
        )}

        {/* Yatırımcının gerekçesi */}
        <div className="mt-6 border border-hairline bg-surface first:mt-0">
          <div className="serit px-4 py-3 etiket text-ink">
            Neden burada? · yatırımcının gerekçesi
          </div>
          <p className="px-4 py-4 text-[13.5px] leading-[1.6] text-ink text-pretty">{o.gerekce}</p>
        </div>

        {/* Puan */}
        {puanlar ? (
          <>
            {/* AI gerekçesi */}
            {o.ai_gerekce && (
              <div className="tex-unverified mt-6 border border-unverif-line border-l-[3px] border-l-unverif [border-left-style:dashed] px-4 py-3.5">
                <div className="etiket text-unverif">
                  <span aria-hidden>◌</span> Yapay zekâ değerlendirmesi
                  {o.durum !== "listede" && " · doğrulanmadı"}
                </div>
                <p className="mt-2 text-[13px] leading-[1.55] text-ink-soft text-pretty">{o.ai_gerekce}</p>
                {o.model_snapshot && (
                  <div className="num mt-2 text-[10px] text-ink-mute">
                    {o.model_snapshot} · {o.prompt_surum}
                  </div>
                )}
              </div>
            )}

            {/* Belge alıntıları */}
            <div className="mt-5 border border-hairline bg-surface">
              <div className="serit px-4 py-3 etiket text-ink">
                Dayandığı üst ölçekli belgeler ({alintilar.length})
              </div>
              {alintilar.length === 0 ? (
                <div className="tex-absent border-l-[3px] [border-left-style:dotted] border-l-absent px-4 py-3.5">
                  <div className="text-[13.5px] font-medium text-ink">Hiçbir belgeye bağlanamadı.</div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
                    Dayanak puanı 0. Bu öneri, puanı yüksek olsa da slot dolduramaz. Ajans ilgili üst ölçekli belgeyi
                    yükledikçe yeniden değerlendirilebilir.
                  </p>
                </div>
              ) : (
                alintilar.map((a, i) => (
                  <div key={i} className="border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0">
                    <div className="etiket text-ink-mute">
                      {a.belge_ad}
                      {a.bolum && <span className="num"> · {a.bolum}</span>}
                    </div>
                    <blockquote className="mt-1.5 border-l-2 border-l-ink pl-3 font-display text-[14.5px] leading-[1.55] text-ink text-pretty">
                      “{a.alinti}”
                    </blockquote>
                  </div>
                ))
              )}
            </div>

            {/* Karşı görüş — aynı belgelerle önerinin aleyhine en güçlü itiraz */}
            <div className="mt-5 border border-hairline bg-surface">
              <div className="serit px-4 py-3 etiket text-ink">
                Karşı görüş ({karsiGorus.length})
              </div>
              <p className="border-b border-b-hairline-soft px-4 py-2.5 text-[12px] leading-[1.45] text-ink-soft">
                Yapay zekâ aynı belgelerle bu önerinin <strong className="font-medium">aleyhine</strong> en güçlü
                itirazı da üretir. Puanı değiştirmez; ajans onayında tartılır.
              </p>
              {karsiGorus.length === 0 ? (
                <div className="px-4 py-3.5">
                  <div className="text-[13.5px] font-medium text-ink">
                    Belgelerde bu öneriye karşı dayanak bulunamadı.
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
                    Bu, itiraz olmadığı anlamına gelmez — yalnızca üst ölçekli belgelere dayandırılabilecek bir itiraz
                    çıkmadığı anlamına gelir.
                  </p>
                </div>
              ) : (
                karsiGorus.map((g, i) => (
                  <div key={i} className="border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0">
                    <Rozet tur="amber">{KARSI_GORUS_ETIKET[g.tur as KarsiGorusTuru] ?? g.tur}</Rozet>
                    <p className="mt-2 text-[13.5px] leading-[1.5] text-ink text-pretty">{g.iddia}</p>
                    {g.alintilar.map((a, j) => (
                      <div key={j} className="mt-2">
                        <div className="etiket text-ink-mute">
                          {a.belge_ad}
                          {a.bolum && <span className="num"> · {a.bolum}</span>}
                        </div>
                        <blockquote className="mt-1 border-l-2 border-l-ink-mute pl-3 text-[13px] leading-[1.5] text-ink-soft text-pretty">
                          “{a.alinti}”
                        </blockquote>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Kriter kırılımı — gruplu, "neden burada?" öne çıkarılmış */}
            <div className="mt-5 border border-hairline bg-surface">
              <div className="serit px-4 py-3 etiket text-ink">
                Kriter kırılımı · ağırlık seti {d.set.surum}
              </div>
              {gruplaraGore(d.set.agirliklar).map(({ grup, agirlik, kriterler }) => (
                <div key={grup} className="border-b border-b-ink last:border-b-0">
                  <div
                    className={cn(
                      "flex items-baseline justify-between gap-3 px-4 py-2.5",
                      grup === "yerellik" ? "bg-ink text-paper" : "bg-paper",
                    )}
                  >
                    <span
                      className={cn(
                        "etiket",
                        grup === "yerellik" ? "text-paper" : "text-ink-mute",
                      )}
                    >
                      {GRUP_ETIKET[grup]}
                    </span>
                    <span className={cn("num text-[12px]", grup === "yerellik" ? "text-paper" : "text-ink-soft")}>
                      %{Math.round(agirlik * 100)}
                    </span>
                  </div>
                  {grup === "yerellik" && (
                    <p className="border-b border-b-hairline-soft bg-paper px-4 py-2.5 text-[12px] leading-[1.45] text-ink-soft">
                      {GRUP_ACIKLAMA.yerellik}
                    </p>
                  )}
                  {kriterler.map((kr: Kriter) => {
                    const dayanak = kriterDayanagi?.[kr];
                    return (
                      <div key={kr} className="border-b border-b-hairline-soft px-4 py-2.5 last:border-b-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[12.5px] leading-[1.35] text-ink-soft">{KRITER_ETIKET[kr]}</span>
                          <span className="num text-[14px]">{puanlar[kr] ?? "—"}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-[7px] flex-1 border border-hairline bg-surface">
                            <div className="h-full bg-ink" style={{ width: `${puanlar[kr] ?? 0}%` }} />
                          </div>
                          <span className="num text-[10px] text-ink-mute">
                            ağırlık {Math.round(d.set.agirliklar[kr] * 100)}%
                          </span>
                        </div>
                        {/* Bu puanı hangi alıntı taşıyor — dayanaksız kriter açıkça yazar. */}
                        {dayanak && dayanak.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 etiket text-ink-mute">
                            {dayanak.map((no) => {
                              const a = alintilar[no];
                              if (!a) return null;
                              return (
                                <span key={no}>
                                  {a.belge_ad}
                                  {a.bolum && <span className="num"> · {a.bolum}</span>}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-1.5 etiket text-absent">
                            Dayanaksız kriter · belgeye bağlanamadı
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : (
          <DegerlendirmeDurumu
            oneriId={Number(id)}
            deneme={o.deneme}
            maksDeneme={3}
            sonHata={o.son_hata}
            asama={o.asama}
            asamaZamani={o.asama_zamani}
            naceAtlandi={o.nace_kaynagi === "kullanici"}
            tetikleyebilir={ajans}
          />
        )}

        </div>

        <aside className="sticky top-[84px] flex flex-col gap-5 max-[1040px]:static">
        {puanlar && (
            <div className="grid grid-cols-2 border border-hairline bg-surface">
              <div className="border-r border-r-hairline-soft px-4 py-3.5">
                <div className="etiket text-ink-mute">Stratejik puan</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="num text-[34px] tracking-[-.02em] leading-none">{o.taban}</span>
                  <span className="text-[11.5px] text-ink-mute">/100 · sekiz kriter</span>
                </div>
              </div>
              <div className="px-4 py-3.5">
                <div className="etiket text-ink-mute">Belge dayanağı</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "num text-[34px] tracking-[-.02em] leading-none",
                      o.dayanak >= d.set.dayanakEsigi ? "text-verified" : "text-unverif",
                    )}
                  >
                    {o.dayanak}
                  </span>
                  <span className="text-[11.5px] text-ink-mute">
                    /100 · eşik {d.set.dayanakEsigi}
                  </span>
                </div>
                {o.dayanak < d.set.dayanakEsigi && (
                  <div className="mt-1 etiket text-unverif">
                    <span aria-hidden>◌</span> Eşik altı — slot dolduramaz
                  </div>
                )}
              </div>
            </div>

        )}
        {ajans &&
          (!puanlar && o.durum === "degerlendiriliyor" && o.asama && !o.son_hata ? (
            <section className="border border-hairline border-t-2 border-t-navy bg-surface px-4 py-4">
              <h2 className="text-[16px] font-semibold tracking-[-.01em] text-ink">Ajans kararı</h2>
              <p className="mt-1 text-[13px] leading-[1.5] text-ink-soft">
                Karar, taslak puan hazır olunca açılır. Değerlendirme şu an sürüyor.
              </p>
            </section>
          ) : (
            <>
              {!puanlar && o.durum === "degerlendiriliyor" && (
                <p className="-mb-2 text-[12.5px] leading-[1.5] text-ink-mute">
                  Bu öneri için henüz yapay zekâ puanı yok; karar puansız verilir.
                </p>
              )}
              <OnayKutusu oneriId={Number(id)} durum={o.durum} yol={`/oneri/${id}`} puanlar={puanlar} />
            </>
          ))}

        <div className="flex flex-wrap gap-2.5">
          {ajans ? (
            <Bag href={`/il/${o.il_kod}`}>{o.il} sıralaması</Bag>
          ) : (
            <Bag href="/onerilerim">Önerilerim</Bag>
          )}
          <Bag href="/oneri">Yeni öneri ver</Bag>
        </div>
        </aside>
        </div>
      </Sayfa>
    </>
  );
}
