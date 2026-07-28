import Link from "next/link";
import { notFound } from "next/navigation";
import { adaylariGetir, donemGetir, kararGetir, panelVerisi } from "@ykh/database";
import { saltOkunur } from "@ykh/domain";
import { ayardan, hesapla } from "@ykh/scoring";
import { EvidenceBand } from "@/components/evidence-band.tsx";
import { KararKilidi } from "@/components/karar-kilidi.tsx";
import { BosSlotSatiri, KararSatiri } from "@/components/karar-satiri.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Blok 1 — İl Karar Ekranı (tasarım README §5).
 *
 * Sıralama SUNUCUDA hesaplanır (§8). İstemci yalnızca senaryo denemesi yapar:
 * `?pay=` devamlılık payını oynatır, sunucu yeniden hesaplar ve sayfa bunun
 * kaydedilmediğini açıkça söyler (§1.7).
 */

const ETIKET = "font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-mute";
const IZGARA = "grid grid-cols-[52px_1fr_96px_92px_128px_150px]";
const DUGME = "font-mono text-[10.5px] uppercase tracking-[.1em] cursor-pointer";

export default async function Blok1({
  params,
  searchParams,
}: {
  params: Promise<{ il: string; donem: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const { il, donem } = await params;
  const { pay: payParam } = await searchParams;

  const b = await baglam();
  const k = await kullanici();
  const d = await donemGetir(b, il, donem);
  if (!d) notFound();

  const payGirdi = Number(payParam);
  const senaryo = payParam !== undefined && Number.isInteger(payGirdi) && payGirdi >= 0 && payGirdi <= 15;
  const pay = senaryo ? payGirdi : d.set.devamlilikPayi;

  const adaylar = await adaylariGetir(b, d);
  const h = hesapla(adaylar, ayardan(d.set, { devamlilikPayi: pay }));
  const panel = await panelVerisi(b, d);
  const karar = saltOkunur(d.durum) ? await kararGetir(b, d.donemId) : null;

  const yol = `/il/${il}/donem/${donem}`;
  const payLinki = `${yol}?pay=${pay > 0 ? 0 : d.set.devamlilikPayi}`;
  const kilitlenebilir = k?.rol === "kurul_uyesi" && !saltOkunur(d.durum) && !senaryo;

  const ozet = [
    { etiket: "Korunuyor", deger: h.ozet.korunuyor, alt: "mevcut konu", renk: "text-verified" },
    { etiket: "Ekleniyor", deger: h.ozet.ekleniyor, alt: "yeni öneri", renk: "text-navy" },
    { etiket: "Çıkıyor", deger: h.ozet.cikiyor, alt: "mevcut konu", renk: "text-conflict" },
    { etiket: "Boş slot", deger: h.ozet.bosSlot, alt: "kanıtlı aday yok", renk: "text-absent" },
  ];

  return (
    <>
      <UstBar
        surum={d.set.surum}
        kilitli={saltOkunur(d.durum)}
        kullanici={k}
        nav={[
          { ad: "İl karar ekranı", yol, aktif: true },
          { ad: "Öneri ver", yol: `${yol}/oneri` },
          { ad: "İnceleme", yol: `${yol}/inceleme` },
          { ad: "Kamu görünümü", yol: `/kamu/${il}/${donem}` },
        ]}
      />

      <section className="mx-auto max-w-[1440px] px-7 pb-18">
        <div className="flex items-end justify-between gap-8 border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div>
            <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
              Blok 1 · İl karar ekranı
            </div>
            <h1 className="font-display text-[40px] leading-[1.06] font-medium tracking-[-.01em]">
              {d.il} — {d.yil} dönemi yatırım konuları
            </h1>
            <p className="mt-2.5 max-w-[64ch] text-[14px] text-ink-soft text-pretty">
              {d.set.slotSayisi} slot. Mevcut konular ve yeni öneriler aynı listede, aynı sekiz kriterle sıralanır.
              Sıralama karar değildir; kurul kararı bu sayfadan kilitlenir.
            </p>
          </div>
          <dl className="flex border border-hairline bg-surface">
            {[
              { k: "Ajans", v: `${d.ajans} · ${d.ajansKod}`, mono: false },
              { k: "İl", v: d.il, mono: false },
              { k: "Dönem", v: d.yil, mono: true },
            ].map((x, i) => (
              <div key={x.k} className={cn("px-[15px] py-[11px]", i < 2 && "border-r border-r-hairline-soft")}>
                <dt className={ETIKET}>{x.k}</dt>
                <dd className={cn("mt-[3px] text-[13.5px] font-medium", x.mono && "num")}>{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[1180px] grid-cols-[minmax(844px,1fr)_336px] border border-t-0 border-hairline bg-surface">
            <div className="border-r border-r-hairline">
              {karar && (
                <div className="flex items-center gap-3 border-b border-b-hairline-soft bg-verified-tint px-[22px] py-3">
                  <span className="font-mono text-[14px] text-verified" aria-hidden>
                    ■
                  </span>
                  <span className="text-[13px] text-ink-soft">
                    <b className="font-semibold text-verified">Karar kilitli.</b> {karar.kilit_zamani.slice(0, 10)} ·{" "}
                    {karar.kilitleyen} · sürüm {karar.surum}. Sayfa salt okunur; değişiklik yeni sürüm açılarak yapılır.
                  </span>
                  <a
                    href={`/kamu/${il}/${donem}/rapor`}
                    className={cn(DUGME, "ml-auto border border-verified-line px-2.5 py-1.5 text-verified")}
                  >
                    Kararı raporla
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3.5 border-b border-b-hairline-soft bg-paper px-[22px] py-3">
                <span className="border border-unverif-line bg-unverif-tint px-[7px] py-[3px] font-mono text-[10px] uppercase tracking-[.14em] text-unverif">
                  Devamlılık payı
                </span>
                <span className="text-[13px] text-ink-soft">
                  Mevcut konulara <b className="num">+{h.pay}</b> puan devamlılık payı uygulandı. Gizli katsayı
                  yoktur; pay sürümlü parametredir — sürüm {d.set.surum}.
                </span>
                {!saltOkunur(d.durum) && (
                  <Link href={payLinki} className={cn(DUGME, "ml-auto border border-ink px-2.5 py-1.5 text-ink")}>
                    {pay > 0 ? "Payı 0 yap" : `Payı +${d.set.devamlilikPayi} yap`}
                  </Link>
                )}
              </div>

              {senaryo && pay !== d.set.devamlilikPayi && (
                <div className="flex items-center gap-3 border-b border-b-hairline-soft bg-unverif-tint px-[22px] py-3">
                  <span className="font-mono text-[14px] text-unverif" aria-hidden>
                    ◆
                  </span>
                  <span className="text-[13px] text-ink-soft">
                    <b className="font-semibold text-[#5F4A15]">Senaryo denemesi — kaydedilmedi.</b> Devamlılık payı
                    sürüm kaydında <b className="num">+{d.set.devamlilikPayi}</b>. Aşağıdaki sıralama karar sürümü
                    değildir ve kilitlenemez.
                  </span>
                  <Link
                    href={yol}
                    className={cn(DUGME, "ml-auto border border-unverif-line px-2.5 py-1.5 text-[#5F4A15]")}
                  >
                    Sürüme dön
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-4 border-b border-b-ink">
                {ozet.map((o, i) => (
                  <div key={o.etiket} className={cn("px-5 py-4", i < 3 && "border-r border-r-hairline-soft")}>
                    <div className={ETIKET}>{o.etiket}</div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className={cn("num text-[28px] leading-none", o.renk)}>{o.deger}</span>
                      <span className="text-[11.5px] text-ink-mute">{o.alt}</span>
                    </div>
                  </div>
                ))}
              </div>

              {h.ucDurum && (
                <div className="flex items-start gap-3 border-b border-b-hairline-soft bg-unverif-tint px-[22px] py-3.5">
                  <span className="font-mono text-[14px] leading-[1.2] text-unverif" aria-hidden>
                    ◆
                  </span>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#5F4A15]">Uç durum: {h.ucDurum.baslik}</div>
                    <div className="mt-[3px] max-w-[78ch] text-[13px] text-ink-soft">{h.ucDurum.metin}</div>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  IZGARA,
                  "bg-ink px-[22px] py-[9px] font-mono text-[9.5px] uppercase tracking-[.13em] text-[#C9CDD3]",
                )}
              >
                <div>Sıra</div>
                <div>Yatırım konusu</div>
                <div>Köken</div>
                <div className="pr-[18px] text-right">Stratejik</div>
                <div>Kanıt yeterliliği</div>
                <div>Sonuç</div>
              </div>

              {adaylar.length === 0 ? (
                <div className="tex-absent border-b border-b-[#E9E5DB] border-l-[3px] [border-left-style:dotted] border-l-absent px-[22px] py-6">
                  <div className="text-[14.5px] font-medium text-ink">Bu dönemde henüz aday yok.</div>
                  <p className="mt-1.5 max-w-[70ch] text-[13px] text-ink-soft">
                    Mevcut konular tanımlanmadı ve hiçbir öneri konu adayı aşamasına gelmedi. İlk öneriyi vererek
                    başlayabilirsiniz.
                  </p>
                  <Link
                    href={`${yol}/oneri`}
                    className="mt-3 inline-block border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
                  >
                    İlk öneriyi ver
                  </Link>
                </div>
              ) : (
                h.ilkDort.map((s) =>
                  s.bos ? (
                    <BosSlotSatiri key={s.sira} satir={s} />
                  ) : (
                    <KararSatiri key={s.id} satir={s} pay={h.pay} esik={h.esik} href={`${yol}/konu/${s.id}`} />
                  ),
                )
              )}

              {adaylar.length > 0 && (
                <div className="border-t-2 border-b border-t-ink border-b-ink bg-paper px-[22px]">
                  <div className="flex items-center gap-3.5 py-[11px]">
                    <span className="font-mono text-[10px] uppercase tracking-[.16em] text-ink">
                      İlk {d.set.slotSayisi} sınırı
                    </span>
                    <div className="h-px flex-1 bg-ink" />
                    <span
                      className={cn(
                        "num text-[11px] tracking-[.06em]",
                        h.fark !== null && h.fark <= 3 ? "text-conflict" : "text-ink-soft",
                      )}
                    >
                      {h.fark === null
                        ? "Sınır karşılaştırması yapılamıyor"
                        : `${d.set.slotSayisi}. ile ${d.set.slotSayisi + 1}. arasındaki fark ${h.fark} puan`}
                    </span>
                    <div className="flex gap-0.5" title="Sıralama sağlamlığı">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-[13px] w-[5px]",
                            i < Math.round(h.saglamlik / 10) ? "bg-ink" : "bg-[#D5D1C7]",
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[.1em] text-ink-soft">
                      Sağlamlık {h.saglamlik}/100
                    </span>
                  </div>
                </div>
              )}

              {h.kalanlar.map((s) => (
                <KararSatiri key={s.id} satir={s} pay={h.pay} esik={h.esik} href={`${yol}/konu/${s.id}`} sonik />
              ))}

              <div className="flex items-center gap-4 bg-paper px-[22px] py-4">
                <p className="max-w-[60ch] text-[12.5px] text-ink-mute">
                  Sıralama, yalnızca <b>uzman onaylı</b> kanıtla hesaplanır. AI bulguları puana girmez; ekranda ayrı
                  işaretlenir. Destek sayısı puan girdisi değildir.
                </p>
                <div className="ml-auto flex gap-2.5">
                  <Link
                    href={`${yol}/inceleme`}
                    className={cn(DUGME, "border border-hairline px-[13px] py-[9px] text-ink")}
                  >
                    Uzman incelemesine geç
                  </Link>
                  {kilitlenebilir ? (
                    <KararKilidi il={il} yil={donem} ilAdi={d.il} surum={d.set.surum} hesap={h} />
                  ) : (
                    <span
                      className="border border-[#D5D1C7] bg-hairline-soft px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-[#8E959F]"
                      title={
                        saltOkunur(d.durum)
                          ? "Dönem kilitli."
                          : senaryo
                            ? "Senaryo görünümünde kilit yapılamaz."
                            : "Kararı yalnızca kurul üyesi kilitleyebilir."
                      }
                    >
                      Kurul kararını kilitle
                    </span>
                  )}
                </div>
              </div>
            </div>

            <aside className="bg-[#FDFCFA]">
              <div className="border-b border-b-hairline-soft px-5 py-4">
                <div className={ETIKET}>İl bağlamı</div>
                <div className="mt-1 font-display text-[19px]">{d.il} · gelen öneri akışı</div>
              </div>

              <div className="border-b border-b-hairline-soft px-5 pt-1 pb-3.5">
                {panel.akis.map((a) => (
                  <div
                    key={a.etiket}
                    className="flex items-baseline justify-between gap-3 border-b border-dotted border-b-hairline-soft py-[9px]"
                  >
                    <span className="text-[13px] text-ink-soft">{a.etiket}</span>
                    <span className="num text-[14px]">{a.deger}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-b-hairline-soft px-5 py-4">
                <div className={cn(ETIKET, "mb-2.5")}>Kanıt sağlığı</div>
                {panel.saglik.map((s) => (
                  <div key={s.etiket} className="mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12.5px] text-ink-soft">{s.etiket}</span>
                      <span className="num text-[11.5px] text-ink-soft">{s.oran} / 100</span>
                    </div>
                    <EvidenceBand
                      className="mt-[5px]"
                      value={s.oran}
                      state={s.ep === "onay" ? "verified" : s.ep === "ai" ? "unverified" : "absent"}
                      cells={12}
                      size="panel"
                      sessiz
                    />
                  </div>
                ))}
              </div>

              <div className="px-5 py-4">
                <div className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[.14em] text-absent">
                  Veri boşlukları
                </div>
                {panel.bosluklar.length === 0 ? (
                  <p className="text-[12.5px] text-ink-mute">Eşik altında aday yok.</p>
                ) : (
                  panel.bosluklar.map((x) => (
                    <div
                      key={x.baslik}
                      className="tex-absent mb-2.5 border-l-[3px] [border-left-style:dotted] border-l-absent py-2.5 pl-3"
                    >
                      <div className="text-[12.5px] font-medium text-ink">{x.baslik}</div>
                      <div className="mt-[3px] text-[12px] text-ink-mute">{x.alt}</div>
                    </div>
                  ))
                )}
                <Link
                  href={`${yol}/inceleme`}
                  className={cn(DUGME, "mt-1 block w-full border border-hairline py-[9px] text-center text-ink")}
                >
                  Kanıt talebi oluştur
                </Link>
              </div>
            </aside>
          </div>
        </div>

        <p className="mt-3.5 font-mono text-[10.5px] tracking-[.08em] text-ink-mute">
          Satıra tıkla → Blok 2 konu detayı ve iddia-kanıt matrisi.
        </p>
      </section>
    </>
  );
}
