import type { Metadata } from "next";
import Link from "next/link";
import { ornekDegerlendirme, platformOzeti } from "@ykh/database";
import { KARSI_GORUS_ETIKET, type KarsiGorusTuru, onaylayabilir } from "@ykh/domain";
import { GRUP_ETIKET, gruplaraGore, KRITER_ETIKET, TR33_2027_V1, type Kriter } from "@ykh/scoring";
import { KanitAgi } from "@/components/kanit-agi.tsx";
import { Bag, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { acikSayfa } from "@/lib/site.ts";

/**
 * Tanıtım sayfası — platformun başlangıç ekranı.
 *
 * Yön: kamu tutanağı. Ne SaaS-krem, ne editoryal-magazin, ne lacivert-altın
 * kurumsal. Ink panel + ölçü cetveli dokusu + tabular sayılar; ochre YALNIZCA
 * ürünün "doğrulanmadı" dediği yerde. Aksan dekoratif değil, anlamlı.
 *
 * Ayırt edici hamle: sayfa mekanizmayı anlatmıyor, ÇALIŞTIĞINI gösteriyor.
 * §4 gerçek bir değerlendirme kaydını açıyor — gerçek alıntı, gerçek atıf
 * çıpası, gerçek model künyesi. Kayıt yoksa uydurma örnek gösterilmez.
 *
 * Sayılar veritabanından; "1000+ yatırımcı" gibi bir cümle bu üründe yazılamaz.
 */

const ACIKLAMA =
  "Yatırım konusu önerileri üst ölçekli plan belgelerine birebir alıntıyla bağlanır, sekiz kriterle " +
  "puanlanır ve kalkınma ajansı onayından geçer. Yapay zekâ puan üretir, karar vermez.";

const TAM_AD = "YKH-KDP · Yerel Kalkınma Hamlesi karar destek platformu";
export const metadata: Metadata = {
  ...acikSayfa({ baslik: TAM_AD, aciklama: ACIKLAMA, yol: "/" }),
  // `title.absolute`: künye şablonu ("%s · YKH-KDP") burada uygulanmasın.
  title: { absolute: TAM_AD },
};

/**
 * Yapılandırılmış veri (schema.org).
 *
 * `GovernmentService` ya da `GovernmentOrganization` KULLANILMIYOR — bu
 * platform resmî Portal'ın yerine geçmiyor ve sayfanın kendi metni bunu
 * yazıyor. Arama sonucunda resmî bir hizmet gibi görünmek, ürünün ilk
 * cümlesiyle çelişen bir iddia olurdu.
 *
 * `WebApplication` doğru sınıf: bir karar HAZIRLIK aracı. `isAccessibleForFree`
 * doğru çünkü öneri vermek kayıt bile istemiyor.
 */
const YAPILANDIRILMIS = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YKH-KDP",
  alternateName: "Yerel Kalkınma Hamlesi Karar Destek Platformu",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  description: ACIKLAMA,
  disambiguatingDescription:
    "Resmî başvuru portalının yerine geçmez; yatırımcı başvuruları başlamadan önceki " +
    "politika hazırlama katmanıdır.",
  featureList: [
    "Üst ölçekli plan belgelerinden birebir alıntıyla gerekçelendirme",
    "Sekiz kriterli, sürümlü ağırlıklarla puanlama",
    "Belge dayanağı ölçümü ve dayanaksız kriterin görünür kalması",
    "Yapay zekânın aynı belgelerle ürettiği karşı görüş",
    "Kalkınma ajansı onayı zorunlu geçit",
  ],
} as const;

/** Landing'de gösterilen alıntı sayısı. Tam kayıt `/oneri/[id]` içinde. */
const ALINTI_LIMITI = 3;

const YERELLIK = Math.round(
  gruplaraGore(TR33_2027_V1.agirliklar).find((g) => g.grup === "yerellik")!.agirlik * 100,
);

/** Zincir: gerçek bir sıra ve sıra bilgi taşıyor — numaralama bu yüzden meşru. */
const ZINCIR = [
  {
    ad: "Yatırımcı öneri verir",
    metin:
      "Yatırım konusu başlığı ve neden bu ilde/ilçede yapılması gerektiği. NACE kodunu biliyorsa girer, " +
      "bilmiyorsa yapay zekâ aday listesinden atar.",
  },
  {
    ad: "Yapay zekâ puanlar",
    metin:
      `Sekiz kriter, dört grup. En büyük pay (%${YERELLIK}) "neden burada?" sorusunda. Puan yalnızca ` +
      "yüklenmiş üst ölçekli belgelere dayanır; internet erişimi yoktur.",
  },
  {
    ad: "Ajans onaylar",
    metin:
      "Puan doğrulanmamış bir taslaktır. Ajans onaylar, puanı düzeltir veya reddeder. Düzeltme ayrı " +
      "kolona yazılır; yapay zekânın ham puanı hiç değişmez.",
  },
  {
    ad: "İl sıralamasına girer",
    metin:
      "Belgeye bağlanamayan aday, puanı yüksek olsa da slot dolduramaz. Yeterince gerekçelendirilebilir " +
      "aday yoksa slot boş kalır. Bu bir hata değil, geçerli bir sonuçtur.",
  },
];

const SINIRLAR = [
  {
    ad: "Karar vermez",
    metin: "Sıralama üretir, seçim yapmaz. Hangi dört konunun seçileceğine ajans karar verir.",
  },
  {
    ad: "Belgede olmayan sayıyı yazmaz",
    metin: "Gerekçedeki her sayısal ifade belgelerde aranır. Kaynağı bulunamayan sayı çıktının tamamını reddettirir.",
  },
  {
    ad: "Alıntı uyduramaz",
    metin:
      "Kaydedilen her alıntı, modele verilmiş bir belgede birebir geçer. Geçmeyen metin kaydedilmez; " +
      "puana, dayanağa, ekrana girmez.",
  },
  {
    ad: "Ezberinden konuşamaz",
    metin:
      "Model bu plan belgelerini tanıyor olabilir. Pakette verilmeyen bölümlerinden yapılan alıntı, gerçek " +
      "olsa bile düşürülür.",
  },
  {
    ad: "Gizli katsayı taşımaz",
    metin: "Ağırlık seti, devamlılık payı ve dayanak eşiği sürümlü kayıtlardır ve ekranda yazar.",
  },
  {
    ad: "Kim yazdı sorusunu kaybetmez",
    metin: "Her puanın model künyesi ve prompt sürümü kayıtlıdır. Ajans düzeltmesi ayrı kolonda durur.",
  },
];

const ROLLER = [
  { rol: "Yatırımcı", yapar: "Öneri verir, kendi önerilerini ve puanlarının dayanağını görür." },
  { rol: "Kalkınma ajansı", yapar: "Onaylar, reddeder, puanı ve NACE kodunu düzeltir, üst ölçekli belge yükler." },
  { rol: "Yönetici", yapar: "Ajansın yaptığı her şey, ayrıca denetim izi ve kişisel veri erişimi." },
];

/** Uygulama üst çubuğuyla aynı genişlik ve kenar boşluğu. */
const KAP = "mx-auto w-full max-w-[1180px] px-6 max-[720px]:px-4";
/** Bölüm başlığı — `Baslik` ölçeğinin bir basamak altı, aynı yüz. */
const H2 =
  "max-w-[30ch] font-display text-[27px] leading-[1.14] font-semibold tracking-[-.02em] text-balance text-ink max-[720px]:text-[22px]";

export default async function Tanitim() {
  const b = await baglam();
  const k = await kullanici();
  const [ozet, ornek] = await Promise.all([platformOzeti(b), ornekDegerlendirme(b)]);
  // İl listesi ve sıralama ajans görünümü; tanıtım sayfası yatırımcıyı
  // sihirbaza, ajansı kendi ekranlarına yollar.
  const ajans = Boolean(k && onaylayabilir(k.rol));
  const nav = ajans
    ? [
        { ad: "İller", yol: "/iller" },
        { ad: "Onay", yol: "/onay" },
        { ad: "Belgeler", yol: "/belgeler" },
        { ad: "Ayarlar", yol: "/ayarlar" },
      ]
    : [{ ad: "Öneri ver", yol: "/oneri" }, ...(k ? [{ ad: "Önerilerim", yol: "/onerilerim" }] : [])];

  const sayi = (n: number) => n.toLocaleString("tr-TR");
  const raf = [
    { ad: "il", deger: sayi(ozet.il) },
    { ad: "kalkınma ajansı", deger: sayi(ozet.ajans) },
    { ad: "NACE Rev.2.1 kodu", deger: sayi(ozet.nace) },
    { ad: "üst ölçekli belge", deger: sayi(ozet.belge) },
    { ad: "aranabilir belge parçası", deger: sayi(ozet.parca) },
  ];

  const dayanaksizKriterler = ornek
    ? (Object.entries(ornek.kriter_dayanagi) as Array<[Kriter, number[]]>)
        .filter(([, v]) => !v.length)
        .map(([kriter]) => kriter)
    : [];

  return (
    <>
      <UstBar kullanici={k} nav={nav} />
      <main>
        {/*
          Yapılandırılmış veri. `dangerouslySetInnerHTML` burada meşru: içerik
          sabit bir nesneden JSON.stringify ile üretiliyor, kullanıcı girdisi
          yok. Alternatifi (bir <script> içine JSX metin düğümü) React'ın
          kaçışıyla bozulurdu.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(YAPILANDIRILMIS) }}
        />

        {/* ── Kapak ─────────────────────────────────────────────────────── */}
        <section className="border-b border-b-hairline bg-surface">
          <div
            className={`${KAP} grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center gap-14 pt-16 pb-14 max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[720px]:pt-10`}
          >
            <div>
              <div className="etiket text-navy">Yerel Kalkınma Hamlesi · karar destek</div>
              <h1 className="mt-3 max-w-[17ch] font-display text-[40px] leading-[1.05] font-semibold tracking-[-.025em] text-ink max-[720px]:text-[30px]">
                Dört yatırım konusu, gerekçesi gösterilebilir olsun.
              </h1>
              <p className="mt-5 max-w-[58ch] text-[15.5px] leading-[1.6] text-pretty text-ink-soft">
                Her il için dört yatırım konusu belirleniyor. Bu platform o kararın hazırlık katmanı: öneriler üst
                ölçekli plan belgelerine <b className="font-semibold text-ink">birebir alıntıyla</b> bağlanır, sekiz
                kriterle puanlanır ve kalkınma ajansı onayından geçer.
              </p>
              <p className="mt-3 max-w-[58ch] text-[13.5px] leading-[1.55] text-ink-mute">
                Resmî başvuru portalının yerine geçmez. Yatırımcı başvuruları başlamadan önceki politika hazırlama
                aşamasıdır.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {ajans ? (
                  <>
                    <Bag varyant="dolu" href="/onay">
                      Onay kuyruğuna git
                    </Bag>
                    <Bag href="/iller">İl sıralamaları</Bag>
                  </>
                ) : (
                  <>
                    <Bag varyant="dolu" href="/oneri">
                      Öneri vermeye başla
                    </Bag>
                    <Bag href={k ? "/onerilerim" : "/giris"}>{k ? "Önerilerim" : "Giriş yap"}</Bag>
                  </>
                )}
              </div>
            </div>

            {/* Kanıt ağı rapordaki bir şekil: çerçeveli, başlıklı, açıklamalı. */}
            <figure className="border border-hairline bg-paper">
              <div className="serit flex items-baseline justify-between gap-4 px-4 py-2.5">
                <span className="etiket">Şekil 1 · Alıntı hatları</span>
                <span className="num text-[11px] text-ink-mute">belge → öneri</span>
              </div>
              <div className="relative aspect-[2/1]">
                <KanitAgi />
              </div>
              <figcaption className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-t-hairline-soft px-4 py-3 text-[12.5px] leading-[1.45] text-ink-soft">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="h-0 w-5 border-t-2 border-t-navy" />
                  Alıntı belgede birebir bulundu
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden className="h-0 w-5 border-t-2 border-dashed border-t-unverif" />
                  Bulunamadı, kayda girmeden düşer
                </span>
              </figcaption>
            </figure>
          </div>

          {/* Ölçü rafı: gerçek sayılar, veritabanından. */}
          <dl
            className={`${KAP} grid grid-cols-5 border-t border-t-hairline-soft max-[900px]:grid-cols-2`}
            aria-label="Platformdaki veri"
          >
            {raf.map((x, i) => (
              <div
                key={x.ad}
                className={`flex flex-col-reverse justify-end py-5 pr-4 max-[900px]:border-b max-[900px]:border-b-hairline-soft ${
                  i ? "border-l border-l-hairline-soft pl-5 max-[900px]:odd:border-l-0 max-[900px]:odd:pl-0" : ""
                }`}
              >
                <dt className="etiket mt-2 text-ink-mute">{x.ad}</dt>
                <dd className="num text-[22px] leading-none text-ink">{x.deger}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Zincir ────────────────────────────────────────────────────── */}
        <section className="border-b border-b-hairline">
          <div className={`${KAP} py-16 max-[720px]:py-12`}>
            <h2 className={H2}>Bir öneri sıralamaya girene kadar dört kapıdan geçer.</h2>
            <ol className="mt-8 border-t border-t-hairline">
              {ZINCIR.map((x, i) => (
                <li
                  key={x.ad}
                  className="grid grid-cols-[40px_220px_minmax(0,1fr)] items-baseline gap-3 border-b border-b-hairline-soft py-4 max-[720px]:grid-cols-[32px_minmax(0,1fr)]"
                >
                  <span className="num text-[12px] text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-[15.5px] font-semibold text-ink">{x.ad}</h3>
                  <p className="max-w-[72ch] text-[14px] leading-[1.55] text-pretty text-ink-soft max-[720px]:col-start-2">
                    {x.metin}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Kanıt · imza anı ──────────────────────────────────────────── */}
        <section className="border-b border-b-hairline bg-surface">
          <div className={`${KAP} py-16 max-[720px]:py-12`}>
            <h2 className={H2}>Anlatmıyoruz. Platformdaki gerçek bir kayıt şöyle görünüyor.</h2>

            {!ornek ? (
              <div className="tex-absent mt-8 border border-hairline-soft border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-5">
                <h3 className="text-[15px] font-semibold">Henüz değerlendirilmiş bir resmî konu yok.</h3>
                <p className="mt-2 max-w-[70ch] text-[13.5px] leading-[1.55] text-ink-soft">
                  Bu bölüm veritabanındaki gerçek kayıtları gösterir ve yalnızca{" "}
                  <b className="font-semibold">yürürlükteki resmî yatırım konularını</b> açar — yatırımcıların
                  gönderdiği öneriler sahibi ve ajans dışında kimseye görünmez. Ajans resmî listeyi değerlendirdiğinde
                  kayıt burada belirir. Örnek uydurulmaz.
                </p>
              </div>
            ) : (
              <article className="mt-8 border border-hairline bg-surface">
                <div className="serit flex flex-wrap items-baseline gap-x-4 gap-y-1.5 px-5 py-2.5">
                  <span className="etiket">Yürürlükteki resmî konu</span>
                  <span className="num text-[11px] text-ink-mute">
                    {ornek.il}
                    {ornek.ilce ? ` · ${ornek.ilce}` : ""}
                  </span>
                  {ajans && (
                    <Link href={`/oneri/${ornek.id}`} className="etiket ml-auto text-navy hover:underline">
                      Tam kaydı aç
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-x-8 gap-y-4 border-b border-b-hairline-soft px-5 py-5 max-[640px]:grid-cols-1">
                  <h3 className="max-w-[40ch] font-display text-[23px] leading-[1.18] font-semibold tracking-[-.015em]">
                    {ornek.baslik}
                  </h3>
                  <div className="text-right max-[640px]:text-left">
                    <div className="etiket text-ink-mute">Belge dayanağı</div>
                    <div className="num mt-1 text-[30px] leading-none text-verified">{ornek.dayanak}</div>
                    <div className="num text-[11px] text-ink-mute">/100 · eşik {TR33_2027_V1.dayanakEsigi}</div>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <div className="etiket text-ink-mute">
                    Dayandığı belgeler ·{" "}
                    {ornek.alintilar.length > ALINTI_LIMITI
                      ? `${ornek.alintilar.length} doğrulanmış alıntıdan ${ALINTI_LIMITI}'ü`
                      : "alıntılar birebir doğrulandı"}
                  </div>
                  {ornek.alintilar.slice(0, ALINTI_LIMITI).map((a, i) => (
                    <figure key={i} className="mt-4 border-l-[3px] border-l-verified pl-4 first:mt-3">
                      <blockquote className="text-[15px] leading-[1.55] text-pretty text-ink">“{a.alinti}”</blockquote>
                      <figcaption className="etiket mt-1.5 text-ink-mute">
                        {a.belge_ad}
                        {a.bolum && <span className="num"> · {a.bolum}</span>}
                      </figcaption>
                    </figure>
                  ))}
                </div>

                {dayanaksizKriterler.length > 0 && (
                  <div className="tex-unverified border-t border-t-unverif-line px-5 py-5">
                    <div className="etiket text-unverif">
                      <span aria-hidden>◌</span> Bu kayıtta belgeye bağlanamayan kriterler
                    </div>
                    <p className="mt-2 max-w-[74ch] text-[13.5px] leading-[1.55] text-ink-soft">
                      {dayanaksizKriterler.map((kr) => KRITER_ETIKET[kr]).join(" · ")}
                    </p>
                    <p className="mt-2 max-w-[74ch] text-[12.5px] leading-[1.5] text-ink-mute">
                      Eksik dayanak gizlenmez. Kriterin puanı yine sayılır ama belge dayanağını düşürür; ajans neyi
                      onayladığını bilerek onaylar.
                    </p>
                  </div>
                )}

                {ornek.karsi_gorus.length > 0 && (
                  <div className="border-t border-t-hairline-soft px-5 py-5">
                    <div className="etiket text-ink-mute">Yapay zekânın aynı belgelerle kurduğu karşı görüş</div>
                    {ornek.karsi_gorus.slice(0, 2).map((g, i) => (
                      <div key={i} className="mt-3">
                        <span className="etiket text-unverif">
                          {KARSI_GORUS_ETIKET[g.tur as KarsiGorusTuru] ?? g.tur}
                        </span>
                        <p className="mt-1 max-w-[74ch] text-[13.5px] leading-[1.55] text-pretty text-ink-soft">
                          {g.iddia}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="num border-t border-t-hairline-soft bg-paper px-5 py-2.5 text-[11px] text-ink-mute">
                  {ornek.model_snapshot} · {ornek.prompt_surum}
                </div>
              </article>
            )}
          </div>
        </section>

        {/* ── Kriter ağırlıkları ────────────────────────────────────────── */}
        <section className="border-b border-b-hairline">
          <div
            className={`${KAP} grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-start gap-x-14 gap-y-8 py-16 max-[820px]:grid-cols-1 max-[720px]:py-12`}
          >
            <div>
              <h2 className={H2}>En büyük pay “neden burada?” sorusunda.</h2>
              <p className="mt-5 max-w-[54ch] text-[14.5px] leading-[1.6] text-pretty text-ink-soft">
                Programın adı <b className="font-semibold text-ink">Yerel</b> Kalkınma Hamlesi. Bir yatırım konusunun
                asıl gerekçesi, o konuyu neden bu ilde ve ilçede yaptığımızdır. Aynı konu başka bir ilde de aynı
                şekilde yapılabiliyorsa bu üç kriter düşük kalır.
              </p>
              <p className="mt-4 max-w-[54ch] text-[13px] leading-[1.55] text-ink-mute">
                Yerellik grubunun payı hiçbir ajans veya dönem setinde %40’ın altına indirilemez ve her zaman en büyük
                gruptur. Bu bir kalibrasyon parametresi değil, ürün kuralıdır: geçersiz bir ağırlık seti sıralama
                hesaplamak yerine hata verir.
              </p>
            </div>

            {/*
              `min-w-0` ŞART: grid öğesi varsayılan `min-width: auto` taşır ve
              420px'lik tablonun altına inmez; dar telefonda SAYFA yatay kayardı.
            */}
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse border border-hairline bg-surface text-left">
                <caption className="sr-only">Kriter gruplarının puandaki payı — TR33-2027-v1 ağırlık seti</caption>
                <thead>
                  <tr className="serit">
                    <th scope="col" className="etiket px-4 py-2.5">
                      Grup
                    </th>
                    <th scope="col" className="etiket px-4 py-2.5">
                      Kriterler
                    </th>
                    <th scope="col" className="etiket px-4 py-2.5 text-right">
                      Pay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gruplaraGore(TR33_2027_V1.agirliklar).map(({ grup, agirlik, kriterler }) => (
                    <tr key={grup} className="border-t border-t-hairline-soft align-top">
                      <th scope="row" className="px-4 py-3 text-[13.5px] font-semibold">
                        {GRUP_ETIKET[grup]}
                      </th>
                      <td className="px-4 py-3 text-[12.5px] leading-[1.45] text-ink-soft">
                        {kriterler.map((kr) => KRITER_ETIKET[kr]).join(" · ")}
                      </td>
                      <td className="num px-4 py-3 text-right text-[15px] whitespace-nowrap">
                        %{Math.round(agirlik * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Sınırlar ──────────────────────────────────────────────────── */}
        <section className="border-b border-b-hairline bg-surface">
          <div className={`${KAP} py-16 max-[720px]:py-12`}>
            <h2 className={H2}>Yapay zekânın burada yapamadıkları.</h2>
            <p className="mt-4 max-w-[68ch] text-[14.5px] leading-[1.6] text-pretty text-ink-soft">
              Bu kontroller “iyi niyetli tavsiye” değil. Her biri kod içinde uygulanır ve ihlal edildiğinde çıktı
              kaydedilmez; öneri değerlendirilmemiş kalır ve neden reddedildiği denetim kaydına yazılır.
            </p>
            <dl className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-x-14">
              {SINIRLAR.map((x) => (
                <div key={x.ad} className="border-t border-t-hairline py-5">
                  <dt className="text-[15px] leading-tight font-semibold">{x.ad}</dt>
                  <dd className="mt-2 max-w-[48ch] text-[13.5px] leading-[1.55] text-pretty text-ink-soft">{x.metin}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Roller ────────────────────────────────────────────────────── */}
        <section className="border-b border-b-hairline">
          <div
            className={`${KAP} grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start gap-x-14 gap-y-8 py-16 max-[820px]:grid-cols-1 max-[720px]:py-12`}
          >
            <h2 className={H2}>Üç rol. Kurum kaydı ve kurum onayı istenmez.</h2>
            <dl className="border-t border-t-hairline">
              {ROLLER.map((x) => (
                <div
                  key={x.rol}
                  className="grid grid-cols-[minmax(140px,180px)_minmax(0,1fr)] gap-x-6 gap-y-1 border-b border-b-hairline-soft py-4 max-[560px]:grid-cols-1"
                >
                  <dt className="text-[14.5px] font-semibold">{x.rol}</dt>
                  <dd className="max-w-[58ch] text-[13.5px] leading-[1.55] text-pretty text-ink-soft">{x.yapar}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Kapanış ───────────────────────────────────────────────────── */}
        <section className="bg-surface">
          <div className={`${KAP} py-16 max-[720px]:py-12`}>
            <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8 border-l-[3px] border-l-navy pl-6 max-[560px]:pl-4">
              <div>
                <h2 className={H2}>İlinizde hangi konu neden öne çıkıyor?</h2>
                <p className="mt-4 max-w-[56ch] text-[14.5px] leading-[1.6] text-pretty text-ink-soft">
                  Sihirbaz sırayla soruyor: ajans bölgesi, il, sonra öneriniz. Kayıt zorunlu değil — kayıt olmadan
                  devam edebilir, sonradan hesap açabilirsiniz. Verdiğiniz öneri size ve ajansa görünür, başka kimseye
                  görünmez.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Bag varyant="dolu" href="/oneri">
                  Öneri sihirbazını başlat
                </Bag>
                <Bag href={k ? "/onerilerim" : "/giris"}>{k ? "Önerilerime bak" : "Hesabıma gir"}</Bag>
              </div>
            </div>
            <p className="etiket mt-12 border-t border-t-hairline pt-4 text-ink-mute">
              Yerel Kalkınma Hamlesi · karar destek platformu. Sıralama bir karar değildir; ajans onayı zorunlu
              geçittir.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
