import Link from "next/link";
import { donemleriListele } from "@ykh/database";
import { DONEM_ETIKET } from "@ykh/domain";
import { UstBar } from "@/components/ust-bar.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/**
 * İl/dönem seçimi. Kodda hiçbir il veya ajans sabitlenmez (brief §5) —
 * liste tamamen veritabanından gelir.
 */
export default async function Iller() {
  const k = await kullanici();
  const donemler = await donemleriListele(await baglam());

  return (
    <>
      <UstBar kullanici={k} nav={[{ ad: "İller", yol: "/iller", aktif: true }, { ad: "Panom", yol: "/panom" }]} />
      <section className="mx-auto max-w-[1440px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
            Blok 0 · il ve dönem seçimi
          </div>
          <h1 className="font-display text-[40px] leading-[1.06] font-medium tracking-[-.01em]">
            Yatırım konusu hazırlama dönemleri
          </h1>
          <p className="mt-2.5 max-w-[64ch] text-[14px] text-ink-soft text-pretty">
            Her il için dört yatırım konusu slotu var. Mevcut konular ve yeni öneriler aynı listede, aynı sekiz
            kriterle yarışır. Sıralama karar değildir; kararı il değerlendirme kurulu verir.
          </p>
        </div>

        {donemler.length === 0 ? (
          <div className="tex-absent mt-6 border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-4">
            <div className="text-[14.5px] font-medium text-ink">Henüz açılmış bir dönem yok.</div>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              Ajans uzmanı bir dönem açtığında burada görünür ve öneri kabulü başlar.
            </p>
          </div>
        ) : (
          <div className="mt-0 border border-t-0 border-hairline bg-surface">
            {donemler.map((d) => (
              <div
                key={`${d.il_kod}-${d.yil}`}
                className="flex items-center gap-4 border-b border-b-[#E9E5DB] px-[22px] py-4 last:border-b-0"
              >
                <div className="min-w-[220px]">
                  <div className="text-[14.5px] font-medium">
                    {d.il} · {d.yil}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">{d.ajans}</div>
                </div>
                <span
                  className={
                    "border px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[.09em] " +
                    (d.durum === "kilitli"
                      ? "border-verified-line bg-verified-tint text-verified"
                      : d.durum === "oneri_acik"
                        ? "border-navy-line bg-navy-tint text-navy"
                        : "border-hairline bg-paper text-ink-mute")
                  }
                >
                  {DONEM_ETIKET[d.durum]}
                </span>
                <div className="ml-auto flex gap-2.5">
                  <Link
                    href={`/kamu/${d.il_kod}/${d.yil}`}
                    className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
                  >
                    Kamu görünümü
                  </Link>
                  <Link
                    href={`/il/${d.il_kod}/donem/${d.yil}/oneri`}
                    className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
                  >
                    Öneri ver
                  </Link>
                  <Link
                    href={`/il/${d.il_kod}/donem/${d.yil}`}
                    className="border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
                  >
                    Karar ekranı
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
