import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import {
  adaylariGetir,
  bolgeler,
  donemGetir,
  ilGetir,
  ilOnerileri,
  konuluYillar,
  sonKesif,
  yatirimKonulari,
  type IlOnerisi,
} from "@ykh/database";
import { onaylayabilir, type DoluSatir, type Sonuc } from "@ykh/domain";
import { ayardan, grupAgirligi, hesapla } from "@ykh/scoring";
import { AsamaRozeti } from "@/components/degerlendirme-durumu.tsx";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { KesifPaneli, KonuPuanla } from "@/components/kesif-paneli.tsx";
import { Bag, Baslik, Rozet, Sayfa, UstBar, Uyari } from "@/components/ui.tsx";
import { resmiDegerlendirEylemi } from "@/lib/eylem.ts";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { KAPALI } from "@/lib/site.ts";
import { cn } from "@/lib/utils.ts";
import { konumaGore, onaylanirsa } from "@/lib/projeksiyon.ts";

/**
 * İl ekranı — AJANS VE YÖNETİCİ. Yalnızca bu ilin verisi.
 *
 * Üç bölüm, karar sırasıyla:
 *   1. Gelecek dönem önerileri, KARAR DURUMUNA göre: asıl liste · yedek ·
 *      onay bekleyen · değerlendiriliyor · liste dışı · reddedilen.
 *      Önceden yalnızca onaylanmış olanlar burada, geri kalanı bütün illeri
 *      karışık listeleyen onay kuyruğundaydı — il incelenirken takip
 *      edilemiyordu.
 *   2. Resmî yatırım konuları, yıl yıl (en yeni önce) ve süreklilik.
 *   3. Araçlar: belgelerden aday keşfi, konu puanlama.
 *
 * Satırlar başka yatırımcıların önerileridir; onay öncesinde de sonrasında da
 * sahibi ve ajans dışında kimseye görünmez (RLS `oneri_oku`).
 */

const SONUC_ROZET: Record<Sonuc, { tur: "yesil" | "notr" | "kirmizi" | "amber" | "gri"; isaret: string }> = {
  korunuyor: { tur: "yesil", isaret: "■" },
  ekleniyor: { tur: "notr", isaret: "▲" },
  çıkıyor: { tur: "kirmizi", isaret: "▼" },
  yedek: { tur: "gri", isaret: "·" },
  "liste dışı": { tur: "gri", isaret: "—" },
  dayanaksız: { tur: "amber", isaret: "◌" },
};

/**
 * ARAMA MOTORUNA VE PAYLAŞIM KARTINA KAPALI. Başlık sabit: önerinin adı sekme
 * adında, geçmişte ve paylaşılan bağlantı önizlemesinde görünürdü.
 */
export const metadata: Metadata = { title: "İl sıralaması", robots: KAPALI };

/** Önerinin kaynağı — ajansın ilk sorduğu şey "bu nereden geldi". */
function kaynak(o: IlOnerisi | undefined): { ad: string; tur: "notr" | "gri" } {
  if (!o) return { ad: "öneri", tur: "gri" };
  if (o.koken === "mevcut") return { ad: `resmî${o.resmi_yillar ? ` · ${o.resmi_yillar}` : ""}`, tur: "notr" };
  if (o.resmi_yillar) return { ad: `önceki resmî · ${o.resmi_yillar}`, tur: "notr" };
  if (o.kesif) return { ad: "belgelerden keşif", tur: "gri" };
  return { ad: "öneri", tur: "gri" };
}

const SUTUN = "grid grid-cols-[44px_minmax(0,1fr)_150px_70px_118px] gap-x-4 max-[860px]:grid-cols-[36px_minmax(0,1fr)_110px]";

/** Kategori bloğu: şerit başlık + sayı + açıklama. Katlanabilir olanlar `<details>`. */
function Kategori({
  id,
  baslik,
  sayi,
  aciklama,
  katli,
  children,
}: {
  id?: string;
  baslik: string;
  sayi: number;
  aciklama?: ReactNode;
  katli?: boolean;
  children: ReactNode;
}) {
  const ust = (
    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="text-[15px] font-semibold tracking-[-.01em] text-ink">
        {baslik} <span className="num ml-1 text-[13.5px] font-normal text-ink-mute">{sayi}</span>
      </span>
      {aciklama && <span className="text-[12.5px] leading-[1.45] text-ink-soft">{aciklama}</span>}
    </span>
  );
  if (katli) {
    return (
      <details id={id} className="group mt-4 border border-hairline bg-surface">
        <summary className="serit flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="num text-[12.5px] text-ink-mute transition-transform group-open:rotate-90">▸</span>
          <span className="min-w-0 flex-1">{ust}</span>
        </summary>
        {children}
      </details>
    );
  }
  return (
    <section id={id} className="mt-4 border border-hairline bg-surface">
      <div className="serit px-4 py-3">{ust}</div>
      {children}
    </section>
  );
}

function Bosluk({ children }: { children: ReactNode }) {
  return <p className="px-4 py-3.5 text-[13.5px] leading-[1.5] text-ink-mute">{children}</p>;
}

/** Sıralama satırı (asıl, yedek, liste dışı). */
function SiraSatiri({ s, o, ikincil }: { s: DoluSatir; o: IlOnerisi | undefined; ikincil?: boolean }) {
  const k = kaynak(o);
  return (
    <Link
      href={`/oneri/${s.id}`}
      className={cn(SUTUN, "items-center border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0 hover:bg-paper", ikincil ? "bg-[#FDFCFA]" : "bg-surface")}
    >
      <div className={cn("num font-display", ikincil ? "text-[15px] text-ink-mute" : "text-[18px] text-ink")}>{s.sira}</div>
      <div className="min-w-0 pr-2">
        <div className="text-[15px] leading-[1.35] font-medium text-pretty [overflow-wrap:anywhere]">{s.ad}</div>
        <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 etiket text-ink-mute">
          {s.nace && <span className="num">NACE {s.nace}</span>}
          <span>dayanak {s.dayanak}/100</span>
          <span className="min-[861px]:hidden">{k.ad}</span>
        </div>
      </div>
      <div className="max-[860px]:hidden">
        <Rozet tur={k.tur}>{k.ad}</Rozet>
      </div>
      <div className="num pr-2 text-right text-[15px] max-[860px]:hidden">{s.puan}</div>
      <div>
        <Rozet tur={SONUC_ROZET[s.sonuc].tur} isaret={SONUC_ROZET[s.sonuc].isaret}>
          {s.sonuc}
        </Rozet>
      </div>
    </Link>
  );
}

/** Süreçteki öneri satırı (onay bekleyen, değerlendiriliyor, reddedilen). */
function SurecSatiri({ o, sag }: { o: IlOnerisi; sag: ReactNode }) {
  const k = kaynak(o);
  return (
    <Link
      href={`/oneri/${o.id}`}
      className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0 hover:bg-paper"
    >
      <span className="num w-[44px] shrink-0 pt-px text-[12.5px] text-ink-mute max-[860px]:w-auto">#{o.id}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-[1.35] font-medium text-pretty [overflow-wrap:anywhere]">{o.baslik}</span>
        <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 etiket text-ink-mute">
          <span className="num">{o.gonderildi}</span>
          <span>{k.ad}</span>
          {o.dayanak !== null && <span>dayanak {o.dayanak}/100</span>}
          {o.taban !== null && <span className="num">puan {o.taban}</span>}
        </span>
        {o.ret_gerekcesi && <span className="mt-1.5 block text-[12.5px] leading-[1.45] text-ink-soft">{o.ret_gerekcesi}</span>}
      </span>
      <span className="shrink-0">{sag}</span>
    </Link>
  );
}

export default async function IlSiralamasi({ params }: { params: Promise<{ il: string }> }) {
  const { il } = await params;
  const b = await baglam();
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) redirect("/oneri");

  const ilKaydi = await ilGetir(b, il);
  if (!ilKaydi) notFound();

  const d = await donemGetir(b, il);
  const yillar = await konuluYillar(b, il);
  const resmiListeler = await Promise.all(yillar.map(async (yil) => ({ yil, konular: await yatirimKonulari(b, il, yil) })));

  const [adaylar, oneriler, kesif, ilceler] = d
    ? await Promise.all([
        adaylariGetir(b, d),
        ilOnerileri(b, d),
        sonKesif(b, d.donemId),
        bolgeler(b).then((x) => x.flatMap((y) => y.iller).find((y) => y.kod === il)?.ilceler ?? []),
      ])
    : [[], [], null, [] as string[]];
  const h = d ? hesapla(adaylar, ayardan(d.set)) : null;
  const yerellik = d ? Math.round(grupAgirligi(d.set.agirliklar, "yerellik") * 100) : 0;
  const oneriBul = new Map(oneriler.map((o) => [String(o.id), o]));

  const yedek = h ? h.kalanlar.filter((x) => x.yedekte) : [];
  const disarida = h ? h.kalanlar.filter((x) => !x.yedekte) : [];
  // En iyi en üstte: onaylanırsa listeye nereye girer (karar modelinin kendisi).
  const bekleyenAdaylar = oneriler
    .filter((o) => o.durum === "onay_bekliyor")
    .map((o) => ({ id: String(o.id), ad: o.baslik, koken: o.koken, taban: o.taban ?? 0, dayanak: o.dayanak ?? 0, nace: null }));
  const konumlar = d ? onaylanirsa(adaylar, bekleyenAdaylar, d) : new Map();
  const onayBekleyen = konumaGore(oneriler.filter((o) => o.durum === "onay_bekliyor"), konumlar);
  const surecte = oneriler.filter((o) => o.durum === "degerlendiriliyor");
  const reddedilen = oneriler.filter((o) => o.durum === "reddedildi");
  const puansizResmi = adaylar.filter((a) => a.koken === "mevcut" && a.dayanak === 0).length;
  const toplamOneri = oneriler.length;

  const bolumler = [
    ...(d ? [{ id: "oneriler", ad: `${d.yil} önerileri`, sayi: toplamOneri }] : []),
    { id: "resmi", ad: "Resmî konular", sayi: resmiListeler.reduce((t, r) => t + r.konular.length, 0) },
    ...(d ? [{ id: "araclar", ad: "Araçlar", sayi: null as number | null }] : []),
  ];

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: ilKaydi.ad, yol: `/il/${il}`, aktif: true },
          { ad: "Onay", yol: "/onay" },
          { ad: "Belgeler", yol: "/belgeler" },
          { ad: "Ayarlar", yol: "/ayarlar" },
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket={
            d
              ? `${ilKaydi.ajans} · ${d.yil} dönemi`
              : `${ilKaydi.ajans}${ilKaydi.kisa_ad ? ` · ${ilKaydi.kisa_ad}` : ""} · açık dönem yok`
          }
          alt={
            d && h ? (
              <>
                {d.yil} için en çok {d.set.slotSayisi} asıl ve {d.set.slotSayisi} yedek yatırım konusu. Puanın en
                büyük payı (<b>%{yerellik}</b>) “neden burada?” sorusuna ait; resmî konulara{" "}
                <b className="num">+{h.pay}</b> devamlılık payı, dayanak eşiği{" "}
                <span className="num">{d.set.dayanakEsigi}</span>, sürüm <span className="num">{d.set.surum}</span>.{" "}
                {d.kalibre ? (
                  <>Ağırlıkları {d.ajans} yayımladı.</>
                ) : (
                  <>
                    <b className="font-medium">{d.ajans} henüz kendi ağırlık setini yayımlamadı</b>; ulusal varsayılan
                    uygulanıyor.
                  </>
                )}
              </>
            ) : (
              <>Bu ilde açık dönem yok; öneri ve sıralama yok. Aşağıda resmî yatırım konuları yıl yıl görünüyor.</>
            )
          }
        >
          {ilKaydi.ad}
        </Baslik>

        {/* Bölümler arası geçiş — uzun sayfada kaybolmamak için */}
        <nav aria-label="Bölümler" className="mt-6 flex flex-wrap gap-2 border-b border-b-hairline bg-page pb-3 min-[721px]:sticky min-[721px]:top-[60px] min-[721px]:z-10 min-[721px]:pt-3">
          {bolumler.map((x) => (
            <a key={x.id} href={`#${x.id}`} className="inline-flex min-h-9 items-center gap-2 border border-hairline bg-surface px-3 text-[13.5px] text-ink hover:border-ink-mute">
              {x.ad}
              {x.sayi !== null && <span className="num text-[12.5px] text-ink-mute">{x.sayi}</span>}
            </a>
          ))}
        </nav>

        {/* ── 1 · Gelecek dönem önerileri ────────────────────────────────── */}
        {d && h && (
          <div id="oneriler" className="scroll-mt-[130px] pt-6">
            <h2 className="text-[27px] max-[720px]:text-[22px] font-semibold tracking-[-.015em] text-ink">{d.yil} için öneri yatırım konuları</h2>

            <dl className="mt-4 grid grid-cols-6 border border-hairline bg-surface max-[860px]:grid-cols-3">
              {[
                { e: "Asıl", v: h.ilkDort.filter((x) => !x.bos).length, r: "text-ink", alt: `/${d.set.slotSayisi}` },
                { e: "Yedek", v: yedek.length, r: "text-ink", alt: `/${d.set.slotSayisi}` },
                { e: "Onay bekliyor", v: onayBekleyen.length, r: onayBekleyen.length ? "text-unverif" : "text-ink" },
                { e: "Değerlendiriliyor", v: surecte.length, r: "text-navy" },
                { e: "Liste dışı", v: disarida.length, r: "text-ink-mute" },
                { e: "Reddedildi", v: reddedilen.length, r: "text-ink-mute" },
              ].map((o, i) => (
                <div key={o.e} className={cn("px-4 py-3", i % 6 !== 5 && "border-r border-r-hairline-soft", "max-[860px]:[&:nth-child(3n)]:border-r-0 max-[860px]:[&:nth-child(-n+3)]:border-b max-[860px]:[&:nth-child(-n+3)]:border-b-hairline-soft")}>
                  <dt className="etiket text-ink-mute">{o.e}</dt>
                  <dd className={cn("num mt-1 text-[27px] leading-none", o.r)}>
                    {o.v}
                    {o.alt && <span className="text-[13.5px] text-ink-mute">{o.alt}</span>}
                  </dd>
                </div>
              ))}
            </dl>

            {puansizResmi > 0 && (
              <Uyari baslik={`Resmî listedeki ${puansizResmi} konu henüz belgelere göre puanlanmadı`}>
                Tebliğden geldiler ve dayanaksız görünüyorlar; gerçek bir puanla yarışmıyorlar. Değerlendirmeye
                alınırsa başlık ve tebliğ gerekçesi olduğu gibi kalır, puan ve dayanak belgelerden hesaplanır,{" "}
                <b className="num">+{h.pay}</b> devamlılık payı eklenir; onayınızla yeniden sıralamaya girerler.
                <EylemFormu eylem={resmiDegerlendirEylemi} className="mt-3">
                  <input type="hidden" name="il" value={il} />
                  <Gonder varyant="amber" bekleme="Kuyruğa alınıyor">
                    Belgelere göre değerlendir
                  </Gonder>
                </EylemFormu>
              </Uyari>
            )}
            {h.ucDurum && (
              <Uyari>
                <b className="font-semibold text-[#5F4A15]">Uç durum: {h.ucDurum.baslik}.</b> {h.ucDurum.metin}
              </Uyari>
            )}

            <Kategori
              baslik="Asıl liste"
              sayi={h.ilkDort.filter((x) => !x.bos).length}
              aciklama={`En çok ${d.set.slotSayisi} slot · onaylanmış öneriler, puan sırasıyla`}
            >
              <div className={cn(SUTUN, "serit border-t border-t-hairline-soft px-4 py-2 etiket text-ink-soft")}>
                <div>Sıra</div>
                <div>Yatırım konusu</div>
                <div className="max-[860px]:hidden">Kaynak</div>
                <div className="text-right max-[860px]:hidden">Puan</div>
                <div>Sonuç</div>
              </div>
              {h.ilkDort.map((s) =>
                s.bos ? (
                  <div
                    key={`bos-${s.sira}`}
                    className="tex-slot grid grid-cols-[44px_minmax(0,1fr)] items-start border-b border-b-hairline-soft border-l-[3px] [border-left-style:dotted] border-l-absent px-4 py-4 last:border-b-0 max-[860px]:grid-cols-[36px_minmax(0,1fr)]"
                  >
                    <div className="num font-display text-[18px] text-absent">{s.sira}</div>
                    <div>
                      <div className="text-[15px] font-medium text-ink-soft">Slot boş — yeterince gerekçelendirilebilir aday yok.</div>
                      <p className="mt-1.5 max-w-[78ch] text-[12.5px] leading-[1.5] text-ink-soft text-pretty">{s.gerekce}</p>
                    </div>
                  </div>
                ) : (
                  <SiraSatiri key={s.id} s={s} o={oneriBul.get(s.id)} />
                ),
              )}
            </Kategori>

            <Kategori baslik="Yedek" sayi={yedek.length} aciklama={`En çok ${d.set.slotSayisi} · eşiği geçen, asıl listenin dışında kalan`}>
              {yedek.length ? yedek.map((s) => <SiraSatiri key={s.id} s={s} o={oneriBul.get(s.id)} ikincil />) : <Bosluk>Yedek sırasında aday yok.</Bosluk>}
            </Kategori>

            <Kategori
              baslik="Onay bekleyen"
              sayi={onayBekleyen.length}
              aciklama={
                onayBekleyen.length ? (
                  <Link href={`/onay?il=${il}`} className="underline decoration-hairline underline-offset-2 hover:decoration-ink">
                    Yalnızca {ilKaydi.ad} kuyruğunu aç
                  </Link>
                ) : (
                  "En iyisi en üstte · onaylanırsa listeye gireceği yer"
                )
              }
            >
              {onayBekleyen.length ? (
                onayBekleyen.map((o) => (
                  <SurecSatiri
                    key={o.id}
                    o={o}
                    sag={
                      konumlar.get(String(o.id)) ? (
                        <Rozet tur={konumlar.get(String(o.id))!.tur === "asıl" ? "notr" : "amber"} isaret="◌">
                          onaylanırsa {konumlar.get(String(o.id))!.tur} #{konumlar.get(String(o.id))!.sira}
                        </Rozet>
                      ) : (
                        <Rozet tur="amber" isaret="◌">
                          karar bekliyor
                        </Rozet>
                      )
                    }
                  />
                ))
              ) : (
                <Bosluk>Kararınızı bekleyen öneri yok.</Bosluk>
              )}
            </Kategori>

            <Kategori baslik="Değerlendiriliyor" sayi={surecte.length} aciklama="Yapay zekâ puanlıyor; puan hazır olunca onay bekleyenlere geçer">
              {surecte.length ? (
                surecte.map((o) => <SurecSatiri key={o.id} o={o} sag={<AsamaRozeti asama={o.asama} hatali={o.hatali} />} />)
              ) : (
                <Bosluk>Şu an değerlendirilen öneri yok.</Bosluk>
              )}
            </Kategori>

            <Kategori katli baslik="Liste dışı ve dayanaksız" sayi={disarida.length} aciklama="Yedek sınırının ötesinde ya da dayanak eşiğinin altında">
              {disarida.length ? disarida.map((s) => <SiraSatiri key={s.id} s={s} o={oneriBul.get(s.id)} ikincil />) : <Bosluk>Yok.</Bosluk>}
            </Kategori>

            <Kategori katli baslik="Reddedilen" sayi={reddedilen.length} aciklama="Ret gerekçesiyle">
              {reddedilen.length ? (
                reddedilen.map((o) => (
                  <SurecSatiri
                    key={o.id}
                    o={o}
                    sag={
                      <Rozet tur="kirmizi" isaret="▼">
                        reddedildi
                      </Rozet>
                    }
                  />
                ))
              ) : (
                <Bosluk>Reddedilen öneri yok.</Bosluk>
              )}
            </Kategori>

            <p className="mt-4 text-[12.5px] leading-[1.5] text-ink-mute">
              Puanlar yapay zekâ tarafından üretilir ve ajans onayından geçer. Belgelere bağlanamayan aday, puanı yüksek
              olsa da slot dolduramaz. Sıralama karar değildir.
            </p>
          </div>
        )}

        {/* ── 2 · Resmî yatırım konuları, yıl yıl ─────────────────────────── */}
        <div id="resmi" className="scroll-mt-[130px] pt-10">
          <h2 className="text-[27px] max-[720px]:text-[22px] font-semibold tracking-[-.015em] text-ink">Resmî yatırım konuları</h2>
          <p className="mt-1 max-w-[78ch] text-[13.5px] leading-[1.55] text-ink-soft">
            Sanayi ve Teknoloji Bakanlığı tebliğleriyle ilan edilen konular, en yeni yıl önce. Yalnızca başlığı birebir
            aynı olan konu “aynen korundu” sayılır; yakın ama yeniden yazılmış başlık doğrulanmamış eşleşmedir.
          </p>
          {resmiListeler.length === 0 ? (
            <Bosluk>Bu il için yüklenmiş resmî liste yok.</Bosluk>
          ) : (
            <div className={cn("mt-4 grid items-start gap-4", resmiListeler.length > 1 && "grid-cols-2 max-[960px]:grid-cols-1")}>
              {resmiListeler.map(({ yil, konular }) => {
                const onceVar = yillar.includes(yil - 1);
                return (
                  <section key={yil} className="border border-hairline bg-surface">
                    <div className="serit flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-2.5">
                      <span className="text-[15px] font-semibold text-ink">
                        <span className="num">{yil}</span> listesi
                      </span>
                      <span className="num etiket text-ink-mute">{konular[0]?.kaynak}</span>
                    </div>
                    {konular.map((x) => (
                      <div key={x.sira} className="border-b border-b-hairline-soft px-4 py-3 last:border-b-0">
                        <div className="flex items-baseline gap-3">
                          <span className="num shrink-0 text-[12.5px] text-ink-mute">{String(x.sira).padStart(2, "0")}</span>
                          <h3 className="min-w-0 flex-1 text-[15px] font-medium leading-[1.35] text-pretty [overflow-wrap:anywhere]">{x.baslik}</h3>
                        </div>
                        {onceVar && (
                          <div className="mt-1.5 pl-[30px]">
                            {x.onceki_durum === "aynen" ? (
                              <Rozet tur="yesil" isaret="■">
                                {yil - 1}’de de aynen vardı
                              </Rozet>
                            ) : x.onceki_durum === "benzer" ? (
                              <Rozet tur="amber" isaret="◌">
                                {yil - 1}’de benzeri · %{Math.round((x.onceki_benzerlik ?? 0) * 100)} · doğrulanmadı
                              </Rozet>
                            ) : (
                              <Rozet tur="notr" isaret="▲">
                                {yil}’de yeni
                              </Rozet>
                            )}
                            {x.onceki_durum === "benzer" && x.onceki_baslik && (
                              <p className="mt-1 text-[12.5px] leading-[1.45] text-ink-mute">
                                {yil - 1}: {x.onceki_baslik}
                              </p>
                            )}
                          </div>
                        )}
                        {x.gerekce && (
                          <details className="mt-1.5 pl-[30px]">
                            <summary className="cursor-pointer etiket text-ink-mute hover:text-ink">Tebliğ gerekçesi</summary>
                            <p className="mt-1.5 max-w-[78ch] text-[13.5px] leading-[1.5] text-pretty text-ink-soft">{x.gerekce}</p>
                          </details>
                        )}
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 3 · Araçlar ─────────────────────────────────────────────────── */}
        {d && (
          <div id="araclar" className="scroll-mt-[130px] pt-10">
            <h2 className="text-[27px] max-[720px]:text-[22px] font-semibold tracking-[-.015em] text-ink">Araçlar</h2>
            <p className="mt-1 max-w-[78ch] text-[13.5px] leading-[1.55] text-ink-soft">
              İkisi de yukarıdaki listeye aday üretir; adaylar aynı sekiz kriterle puanlanır ve onayınızı bekler.
            </p>
            <div className="mt-4 grid grid-cols-2 items-start gap-5 max-[1040px]:grid-cols-1">
              <KesifPaneli il={il} kesif={kesif} />
              <KonuPuanla il={{ kod: il, ad: ilKaydi.ad, ilceler }} yerellikPayi={yerellik} />
            </div>
          </div>
        )}

        {!d && (
          <p className="mt-6 text-[12.5px] leading-[1.5] text-ink-mute">
            Ajans bu il için bir dönem açtığında öneri kabulü başlar ve resmî konular sıralamaya mevcut aday olarak girer.
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-2.5">
          <Bag href="/iller">Bütün iller</Bag>
          {d && <Bag href={`/onay?il=${il}`}>{ilKaydi.ad} onay kuyruğu</Bag>}
        </div>
      </Sayfa>
    </>
  );
}
