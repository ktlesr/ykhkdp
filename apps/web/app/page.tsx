import type { Metadata } from "next";
import Link from "next/link";
import { ornekDegerlendirme, platformOzeti } from "@ykh/database";
import { KARSI_GORUS_ETIKET, type KarsiGorusTuru } from "@ykh/domain";
import { GRUP_ETIKET, gruplaraGore, KRITER_ETIKET, TR33_2027_V1, type Kriter } from "@ykh/scoring";
import { baglam, kullanici } from "@/lib/oturum.ts";

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

export const metadata: Metadata = {
  title: "YKH-KDP · Yerel Kalkınma Hamlesi karar destek platformu",
  description:
    "Yatırım konusu önerileri üst ölçekli plan belgelerine birebir alıntıyla bağlanır, sekiz kriterle " +
    "puanlanır ve kalkınma ajansı onayından geçer. Yapay zekâ puan üretir, karar vermez.",
};

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

export default async function Tanitim() {
  const b = await baglam();
  const k = await kullanici();
  const [ozet, ornek] = await Promise.all([platformOzeti(b), ornekDegerlendirme(b)]);

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
    <main>
      {/* ── Hero · ink panel ─────────────────────────────────────────────── */}
      <section className="panel-koyu tex-cetvel">
        <div className="mx-auto w-full max-w-[1120px] px-6 max-[560px]:px-4">
          <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-b-[#2A3039] py-4">
            <Link href="/" className="border-0 font-mono text-[10.5px] uppercase tracking-[.16em] text-[#EDE9E0]">
              YKH<span className="text-[#8E959F]">·</span>KDP
            </Link>
            <span className="font-mono text-[9.5px] uppercase tracking-[.14em] text-[#8E959F]">
              Yerel Kalkınma Hamlesi · karar destek
            </span>
            <nav className="ml-auto flex items-center gap-5 font-mono text-[10px] uppercase tracking-[.12em]">
              <Link href="/iller" className="border-0 text-[#C9CDD3]">
                İller
              </Link>
              {k ? (
                <>
                  <Link href="/oneri" className="border-0 text-[#C9CDD3]">
                    Öneri ver
                  </Link>
                  <Link href="/onerilerim" className="border-0 text-[#C9CDD3]">
                    Önerilerim
                  </Link>
                </>
              ) : (
                <Link href="/giris" className="border-0 text-[#C9CDD3]">
                  Giriş yap
                </Link>
              )}
            </nav>
          </header>

          <div className="grid grid-cols-[1.35fr_1fr] gap-x-12 gap-y-10 pt-16 pb-14 max-[900px]:grid-cols-1 max-[900px]:pt-12">
            <div>
              <h1
                className="max-w-[26ch] font-display text-[clamp(1.9rem,4.6vw,2.5rem)] font-medium leading-[1.06] tracking-[-0.01em] text-balance text-[#F6F4EF]"
              >
                Dört yatırım konusu, gerekçesi gösterilebilir olsun.
              </h1>
              <p
                className="mt-6 max-w-[62ch] text-[16px] leading-[1.5] text-pretty text-[#C9CDD3]"
              >
                Yerel Kalkınma Hamlesi kapsamında her il için dört yatırım konusu belirleniyor. Bu platform o kararın
                hazırlık katmanı: öneriler üst ölçekli plan belgelerine <b className="font-medium text-[#EDE9E0]">birebir
                alıntıyla</b> bağlanır, sekiz kriterle puanlanır ve ajans onayından geçer.
              </p>
              <p
                className="mt-4 max-w-[62ch] text-[13.5px] leading-[1.5] text-[#8E959F]"
              >
                Resmî başvuru portalının yerine geçmez. Yatırımcı başvuruları başlamadan önceki politika hazırlama
                aşamasıdır.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/iller"
                  className="dugme-ters inline-flex min-h-12 items-center border px-6 font-mono text-[11px] uppercase tracking-[.13em]"
                >
                  Başla
                </Link>
                <Link
                  href="/oneri"
                  className="inline-flex min-h-12 items-center border border-[#5C6470] px-6 font-mono text-[11px] uppercase tracking-[.13em] text-[#EDE9E0]"
                >
                  Öneri sihirbazı
                </Link>
              </div>
            </div>

            {/* Ölçü rafı: gerçek sayılar, mono ve tabular. Büyük-rakam
                şablonu değil — cetvel gibi okunuyor. */}
            <dl
              className="self-end border-t border-t-[#2A3039]"
              aria-label="Platformdaki veri"
            >
              {raf.map((x) => (
                <div
                  key={x.ad}
                  className="flex items-baseline justify-between gap-4 border-b border-b-[#2A3039] py-2.5"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[.11em] text-[#8E959F]">{x.ad}</dt>
                  <dd className="num text-[17px] leading-none text-[#EDE9E0]">{x.deger}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Zincir ───────────────────────────────────────────────────────── */}
      <section className="border-b border-b-hairline bg-page">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 max-[560px]:px-4 max-[560px]:py-12">
          <h2 className="max-w-[32ch] font-display text-[clamp(1.5rem,2.8vw,1.9375rem)] font-medium leading-[1.12] tracking-[-0.01em] text-balance">
            Bir öneri sıralamaya girene kadar dört kapıdan geçer.
          </h2>

          <ol className="mt-10">
            {ZINCIR.map((x, i) => (
              <li
                key={x.ad}
                className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-t-hairline py-6 last:border-b last:border-b-hairline max-[640px]:gap-x-4"
                style={{ paddingLeft: `calc(${i} * clamp(0px, 2.2vw, 34px))` }}
              >
                <span className="num pt-1 text-[13px] text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-[17px] font-medium leading-tight">{x.ad}</h3>
                  <p className="mt-2 max-w-[70ch] text-[14px] leading-[1.6] text-pretty text-ink-soft">{x.metin}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Kanıt · imza anı ─────────────────────────────────────────────── */}
      <section className="border-b border-b-hairline bg-paper">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 max-[560px]:px-4 max-[560px]:py-12">
          <h2 className="max-w-[36ch] font-display text-[clamp(1.5rem,2.8vw,1.9375rem)] font-medium leading-[1.12] tracking-[-0.01em] text-balance">
            Anlatmıyoruz. Platformdaki gerçek bir kayıt şöyle görünüyor.
          </h2>

          {!ornek ? (
            <div className="tex-absent mt-8 border border-hairline px-5 py-6">
              <h3 className="text-[15px] font-medium">Henüz değerlendirilmiş bir resmî konu yok.</h3>
              <p className="mt-2 max-w-[70ch] text-[14px] leading-[1.55] text-ink-soft">
                Bu bölüm veritabanındaki gerçek kayıtları gösterir ve yalnızca <b className="font-medium">yürürlükteki
                resmî yatırım konularını</b> açar — yatırımcıların gönderdiği öneriler sahibi ve ajans dışında
                kimseye görünmez. Ajans resmî listeyi değerlendirdiğinde kayıt burada belirir. Örnek uydurulmaz.
              </p>
            </div>
          ) : (
            <article className="mt-8 border border-ink bg-surface">
              <div className="panel-koyu flex flex-wrap items-baseline gap-x-4 gap-y-1.5 px-5 py-3 text-[#C9CDD3]">
                <span className="font-mono text-[10px] uppercase tracking-[.13em]">Yürürlükteki resmî konu</span>
                <span className="num font-mono text-[10px] tracking-[.08em]">
                  {ornek.il}
                  {ornek.ilce ? ` · ${ornek.ilce}` : ""}
                </span>
                <Link
                  href={`/oneri/${ornek.id}`}
                  className="ml-auto border-0 font-mono text-[10px] uppercase tracking-[.11em] text-[#EDE9E0] underline decoration-[#5C6470] underline-offset-4"
                >
                  Tam kaydı aç
                </Link>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-x-8 gap-y-4 border-b border-b-hairline-soft px-5 py-5 max-[640px]:grid-cols-1">
                <h3 className="max-w-[40ch] font-display text-[24px] font-medium leading-[1.15] text-balance">{ornek.baslik}</h3>
                <div className="text-right max-[640px]:text-left">
                  <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">Belge dayanağı</div>
                  <div className="num mt-1 text-[30px] leading-none text-verified">{ornek.dayanak}</div>
                  <div className="font-mono text-[10px] tracking-[.08em] text-ink-mute">
                    /100 · eşik {TR33_2027_V1.dayanakEsigi}
                  </div>
                </div>
              </div>

              <div className="border-b border-b-hairline-soft px-5 py-5">
                <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                  Dayandığı belgeler ·{" "}
                  {ornek.alintilar.length > ALINTI_LIMITI
                    ? `${ornek.alintilar.length} doğrulanmış alıntıdan ${ALINTI_LIMITI}'ü`
                    : "alıntılar birebir doğrulandı"}
                </div>
                {ornek.alintilar.slice(0, ALINTI_LIMITI).map((a, i) => (
                  <figure key={i} className="mt-4 first:mt-3">
                    <blockquote className="font-display text-[16px] leading-[1.5] text-pretty text-ink">
                      “{a.alinti}”
                    </blockquote>
                    <figcaption className="mt-1.5 font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute">
                      {a.belge_ad}
                      {a.bolum && <span className="num"> · {a.bolum}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>

              {dayanaksizKriterler.length > 0 && (
                <div className="tex-unverified border-t border-t-unverif-line px-5 py-5">
                  <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-unverif">
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
                <div className="border-t border-t-hairline px-5 py-5">
                  <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                    Yapay zekânın aynı belgelerle kurduğu karşı görüş
                  </div>
                  {ornek.karsi_gorus.slice(0, 2).map((g, i) => (
                    <div key={i} className="mt-3">
                      <span className="font-mono text-[9.5px] uppercase tracking-[.1em] text-unverif">
                        {KARSI_GORUS_ETIKET[g.tur as KarsiGorusTuru] ?? g.tur}
                      </span>
                      <p className="mt-1 max-w-[74ch] text-[13.5px] leading-[1.55] text-pretty text-ink-soft">
                        {g.iddia}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="num border-t border-t-hairline bg-page px-5 py-2.5 font-mono text-[10px] tracking-[.06em] text-ink-mute">
                {ornek.model_snapshot} · {ornek.prompt_surum}
              </div>
            </article>
          )}
        </div>
      </section>

      {/* ── Kriter ağırlıkları ───────────────────────────────────────────── */}
      <section className="border-b border-b-hairline bg-page">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 max-[560px]:px-4 max-[560px]:py-12">
          <div className="grid grid-cols-[1fr_1.15fr] items-start gap-x-12 gap-y-8 max-[820px]:grid-cols-1">
            <div>
              <h2 className="max-w-[28ch] font-display text-[clamp(1.5rem,2.8vw,1.9375rem)] font-medium leading-[1.12] tracking-[-0.01em] text-balance">
                En büyük pay “neden burada?” sorusunda.
              </h2>
              <p className="mt-5 max-w-[54ch] text-[14.5px] leading-[1.6] text-pretty text-ink-soft">
                Programın adı <b className="font-medium">Yerel</b> Kalkınma Hamlesi. Bir yatırım konusunun asıl
                gerekçesi, o konuyu neden bu ilde ve ilçede yaptığımızdır. Aynı konu başka bir ilde de aynı şekilde
                yapılabiliyorsa bu üç kriter düşük kalır.
              </p>
              <p className="mt-4 max-w-[54ch] text-[13px] leading-[1.55] text-ink-mute">
                Yerellik grubunun payı hiçbir ajans veya dönem setinde %40’ın altına indirilemez ve her zaman en büyük
                gruptur. Bu bir kalibrasyon parametresi değil, ürün kuralıdır: geçersiz bir ağırlık seti sıralama
                hesaplamak yerine hata verir.
              </p>
            </div>

            {/* Geniş içerik kendi kabında kayar; sayfa gövdesi yatay kaymaz. */}
            <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse border border-hairline bg-surface text-left">
              <caption className="sr-only">
                Kriter gruplarının puandaki payı — TR33-2027-v1 ağırlık seti
              </caption>
              <thead>
                <tr className="panel-koyu text-[#C9CDD3]">
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9.5px] font-normal uppercase tracking-[.12em]">
                    Grup
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9.5px] font-normal uppercase tracking-[.12em]">
                    Kriterler
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-mono text-[9.5px] font-normal uppercase tracking-[.12em]"
                  >
                    Pay
                  </th>
                </tr>
              </thead>
              <tbody>
                {gruplaraGore(TR33_2027_V1.agirliklar).map(({ grup, agirlik, kriterler }) => (
                  <tr key={grup} className="border-t border-t-hairline-soft align-top">
                    <th scope="row" className="px-4 py-3 text-[13.5px] font-medium">
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
        </div>
      </section>

      {/* ── Sınırlar ─────────────────────────────────────────────────────── */}
      <section className="border-b border-b-hairline bg-paper">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 max-[560px]:px-4 max-[560px]:py-12">
          <h2 className="max-w-[34ch] font-display text-[clamp(1.5rem,2.8vw,1.9375rem)] font-medium leading-[1.12] tracking-[-0.01em] text-balance">
            Yapay zekânın burada yapamadıkları.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-[1.6] text-pretty text-ink-soft">
            Bu kontroller “iyi niyetli tavsiye” değil. Her biri kod içinde uygulanır ve ihlal edildiğinde çıktı
            kaydedilmez; öneri değerlendirilmemiş kalır ve neden reddedildiği denetim kaydına yazılır.
          </p>

          <dl className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-x-14">
            {SINIRLAR.map((x) => (
              <div key={x.ad} className="border-t border-t-ink py-5">
                <dt className="text-[15px] font-medium leading-tight">{x.ad}</dt>
                <dd className="mt-2 max-w-[46ch] text-[13.5px] leading-[1.55] text-pretty text-ink-soft">{x.metin}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Roller ───────────────────────────────────────────────────────── */}
      <section className="border-b border-b-hairline bg-page">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 max-[560px]:px-4 max-[560px]:py-12">
          <div className="grid grid-cols-[1fr_1.3fr] items-start gap-x-12 gap-y-8 max-[820px]:grid-cols-1">
            <h2 className="max-w-[24ch] font-display text-[clamp(1.5rem,2.8vw,1.9375rem)] font-medium leading-[1.12] tracking-[-0.01em] text-balance">
              Üç rol. Kurum kaydı ve kurum onayı istenmez.
            </h2>
            <dl>
              {ROLLER.map((x) => (
                <div key={x.rol} className="grid grid-cols-[minmax(140px,180px)_1fr] gap-x-6 gap-y-1 border-t border-t-hairline py-4 last:border-b last:border-b-hairline max-[560px]:grid-cols-1">
                  <dt className="text-[14.5px] font-medium">{x.rol}</dt>
                  <dd className="max-w-[58ch] text-[13.5px] leading-[1.55] text-pretty text-ink-soft">{x.yapar}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Kapanış ──────────────────────────────────────────────────────── */}
      <section className="panel-koyu tex-cetvel">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 max-[560px]:px-4 max-[560px]:py-12">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
            <div>
              <h2 className="max-w-[28ch] font-display text-[clamp(1.6rem,3vw,2.125rem)] font-medium leading-[1.1] tracking-[-0.01em] text-balance text-[#F6F4EF]">
                İlinizde hangi konu neden öne çıkıyor?
              </h2>
              <p className="mt-4 max-w-[56ch] text-[14.5px] leading-[1.6] text-pretty text-[#C9CDD3]">
                Sıralamayı herkes görebilir. Öneri vermek için kayıt zorunlu değil: kayıt olmadan devam edebilir,
                sonradan hesap açabilirsiniz.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/oneri"
                className="dugme-ters inline-flex min-h-12 items-center border px-6 font-mono text-[11px] uppercase tracking-[.13em]"
              >
                Öneri sihirbazını başlat
              </Link>
              <Link
                href="/iller"
                className="inline-flex min-h-12 items-center border border-[#5C6470] px-6 font-mono text-[11px] uppercase tracking-[.13em] text-[#EDE9E0]"
              >
                İl sıralamalarına bak
              </Link>
            </div>
          </div>

          <p className="mt-12 border-t border-t-[#2A3039] pt-4 font-mono text-[10px] leading-[1.6] tracking-[.06em] text-[#8E959F]">
            Yerel Kalkınma Hamlesi · karar destek platformu. Sıralama bir karar değildir; ajans onayı zorunlu geçittir.
          </p>
        </div>
      </section>
    </main>
  );
}
