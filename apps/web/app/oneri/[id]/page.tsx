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
import { cn } from "@/lib/utils.ts";

/** Öneri detayı — AI bu puanı neye dayanarak verdi. */
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
  const durumTuru = { listede: "yesil", onay_bekliyor: "amber", degerlendiriliyor: "notr", reddedildi: "kirmizi" } as const;
  const alintilar = o.alintilar ?? [];
  const kriterDayanagi = o.kriter_dayanagi ?? null;
  const karsiGorus = o.karsi_gorus ?? [];

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/" },
          { ad: o.il, yol: `/il/${o.il_kod}` },
          ...(ajans ? [{ ad: "Onay", yol: "/onay" }] : []),
        ]}
      />
      <Sayfa>
        <Baslik ustEtiket={`${o.il} · ${o.yil} dönemi · ${o.ilce ?? ""}`}>{o.baslik}</Baslik>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Rozet tur={durumTuru[o.durum]} isaret={o.durum === "listede" ? "■" : o.durum === "reddedildi" ? "▼" : "◌"}>
            {ONERI_DURUM_ETIKET[o.durum]}
          </Rozet>
          {o.nace_kod && (
            <Rozet tur={o.nace_kaynagi === "ai" ? "amber" : "notr"}>
              NACE {o.nace_kod} · {o.nace_kaynagi ? NACE_KAYNAK_ETIKET[o.nace_kaynagi] : ""}
            </Rozet>
          )}
          {o.duzeltildi && <Rozet tur="notr">Puan ajans tarafından düzeltildi</Rozet>}
        </div>

        <p className="mt-3 text-[13px] leading-[1.5] text-ink-soft">{ONERI_DURUM_ACIKLAMA[o.durum]}</p>

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
        <div className="mt-6 border border-hairline bg-surface">
          <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
            Neden burada? · yatırımcının gerekçesi
          </div>
          <p className="px-4 py-4 text-[13.5px] leading-[1.6] text-ink text-pretty">{o.gerekce}</p>
        </div>

        {/* Puan */}
        {puanlar ? (
          <>
            <div className="mt-6 grid grid-cols-2 border border-hairline bg-surface">
              <div className="border-r border-r-hairline-soft px-4 py-3.5">
                <div className="font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-mute">Stratejik puan</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="num text-[26px] leading-none">{o.taban}</span>
                  <span className="text-[11.5px] text-ink-mute">/100 · sekiz kriter</span>
                </div>
              </div>
              <div className="px-4 py-3.5">
                <div className="font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-mute">Belge dayanağı</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "num text-[26px] leading-none",
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
                  <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[.08em] text-unverif">
                    <span aria-hidden>◌</span> Eşik altı — slot dolduramaz
                  </div>
                )}
              </div>
            </div>

            {/* AI gerekçesi */}
            {o.ai_gerekce && (
              <div className="tex-unverified mt-5 border border-unverif-line border-l-[3px] border-l-unverif px-4 py-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[.12em] text-unverif">
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
              <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
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
                  <div key={i} className="border-b border-b-[#E9E5DB] px-4 py-3.5 last:border-b-0">
                    <div className="font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute">
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
              <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                Karşı görüş ({karsiGorus.length})
              </div>
              <p className="border-b border-b-[#E9E5DB] px-4 py-2.5 text-[12px] leading-[1.45] text-ink-soft">
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
                  <div key={i} className="border-b border-b-[#E9E5DB] px-4 py-3.5 last:border-b-0">
                    <Rozet tur="amber">{KARSI_GORUS_ETIKET[g.tur as KarsiGorusTuru] ?? g.tur}</Rozet>
                    <p className="mt-2 text-[13.5px] leading-[1.5] text-ink text-pretty">{g.iddia}</p>
                    {g.alintilar.map((a, j) => (
                      <div key={j} className="mt-2">
                        <div className="font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute">
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
              <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
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
                        "font-mono text-[10px] uppercase tracking-[.12em]",
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
                    <p className="border-b border-b-[#E9E5DB] bg-paper px-4 py-2.5 text-[12px] leading-[1.45] text-ink-soft">
                      {GRUP_ACIKLAMA.yerellik}
                    </p>
                  )}
                  {kriterler.map((kr: Kriter) => {
                    const dayanak = kriterDayanagi?.[kr];
                    return (
                      <div key={kr} className="border-b border-b-[#E9E5DB] px-4 py-2.5 last:border-b-0">
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
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[.07em] text-ink-mute">
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
                          <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[.07em] text-absent">
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
          />
        )}

        {ajans && <OnayKutusu oneriId={Number(id)} durum={o.durum} yol={`/oneri/${id}`} puanlar={puanlar} />}

        <div className="mt-6 flex gap-2.5">
          <Bag href={`/il/${o.il_kod}`}>{o.il} sıralaması</Bag>
          <Bag href="/oneri">Yeni öneri ver</Bag>
        </div>
      </Sayfa>
    </>
  );
}
