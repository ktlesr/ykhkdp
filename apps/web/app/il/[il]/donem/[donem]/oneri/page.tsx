import Link from "next/link";
import { notFound } from "next/navigation";
import { donemGetir, islem } from "@ykh/database";
import { oneriKabulEdiyor, DONEM_ETIKET } from "@ykh/domain";
import { OneriFormu } from "@/components/oneri-formu.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/** Blok 3 — Öneri Girişi. Giriş serbest, mobil öncelikli. */
export default async function Blok3({ params }: { params: Promise<{ il: string; donem: string }> }) {
  const { il, donem } = await params;
  const b = await baglam();
  const k = await kullanici();

  const d = await donemGetir(b, il, donem);
  if (!d) notFound();

  const ilceler = await islem(b, (sql) =>
    sql<{ ad: string }[]>`select ad from ilce where il_kod = ${il} order by (ad <> 'Merkez'), ad`,
  );

  const yol = `/il/${il}/donem/${donem}`;
  const acik = oneriKabulEdiyor(d.durum) || d.durum === "degerlendirme";

  return (
    <>
      <UstBar
        surum={d.set.surum}
        kilitli={d.durum === "kilitli"}
        kullanici={k}
        nav={[
          { ad: "İl karar ekranı", yol },
          { ad: "Öneri ver", yol: `${yol}/oneri`, aktif: true },
          { ad: "Panom", yol: "/panom" },
        ]}
      />

      <section className="mx-auto max-w-[1440px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[26px] pb-4">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
            Blok 3 · öneri girişi · giriş serbest
          </div>
          <h1 className="font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">
            {d.il} · {d.yil} dönemi için öneri ver
          </h1>
          <p className="mt-2 max-w-[80ch] text-[14px] text-ink-soft text-pretty">
            Kurumsal kayıt yok: kişi kendi adına, e-posta doğrulamasıyla giriyor. İki kademe: <b>hızlı öneri</b> (beş
            dakika, kanıt zorunlu değil) ve <b>dosya güçlendirme</b> (sonradan dönüp kanıt ekliyor).
          </p>
        </div>

        {!acik ? (
          <div className="tex-absent mt-6 border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-4">
            <div className="text-[14.5px] font-medium text-ink">
              Bu dönem öneri kabul etmiyor — {DONEM_ETIKET[d.durum]}.
            </div>
            <p className="mt-1.5 max-w-[70ch] text-[13px] text-ink-soft">
              {d.durum === "kilitli"
                ? "Karar kilitlendi; bu dönemin listesi dondu. Bir sonraki dönem açıldığında öneri verebilirsiniz."
                : "Dönem henüz hazırlık aşamasında. Açıldığında burada duyurulur."}
            </p>
            <Link
              href="/iller"
              className="mt-3 inline-block border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
            >
              Açık dönemlere bak
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            {!k && (
              <div className="mb-5 flex items-center gap-3.5 border border-hairline bg-paper px-4 py-3.5">
                <span className="text-[13.5px] text-ink-soft">
                  Öneri göndermek için giriş yapın. Kurum kaydı, kurum doğrulama ve kurum onayı yoktur.
                </span>
                <Link
                  href={`/giris?hedef=${encodeURIComponent(`${yol}/oneri`)}`}
                  className="ml-auto border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
                >
                  Giriş yap
                </Link>
                <Link
                  href="/kayit"
                  className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
                >
                  Kayıt ol
                </Link>
              </div>
            )}
            <OneriFormu
              donemId={d.donemId}
              ilAdi={d.il}
              yil={d.yil}
              ilceler={ilceler.map((x) => x.ad)}
              girisYapildi={Boolean(k)}
            />
          </div>
        )}
      </section>
    </>
  );
}
