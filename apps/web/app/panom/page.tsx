import Link from "next/link";
import { redirect } from "next/navigation";
import { onerilerim } from "@ykh/database";
import { ONERI_DURUM_ETIKET } from "@ykh/domain";
import { EvidenceBand } from "@/components/evidence-band.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/** Kişisel pano — gönderilen öneriler, durumları ve sizden istenenler. */
export default async function Panom() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fpanom");

  const oneriler = await onerilerim(await baglam());

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: "Panom", yol: "/panom", aktif: true },
        ]}
      />
      <section className="mx-auto max-w-[1100px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">Panom</div>
          <h1 className="font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">
            Gönderdiğiniz öneriler
          </h1>
          <p className="mt-2.5 max-w-[70ch] text-[14px] text-ink-soft text-pretty">
            Her önerinin durumu ve sizden istenenler burada. Uzman revizyon isterse gerekçesi görünür; kimliğiniz
            kamuya açık yayımda gizli kalır.
          </p>
        </div>

        {oneriler.length === 0 ? (
          <div className="tex-absent mt-6 border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-4">
            <div className="text-[14.5px] font-medium text-ink">Henüz öneri vermediniz.</div>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              Kanıt şart değil — önerinizi bırakın, dosyayı sonra güçlendirin.
            </p>
            <Link
              href="/iller"
              className="mt-3 inline-block border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
            >
              İlk öneriyi ver
            </Link>
          </div>
        ) : (
          <div className="border border-t-0 border-hairline bg-surface">
            {oneriler.map((o) => (
              <Link
                key={o.id}
                href={`/oneri/${o.id}`}
                className="grid grid-cols-[1fr_140px_170px_110px] items-center gap-4 border-b border-b-[#E9E5DB] px-[22px] py-4 last:border-b-0 hover:bg-paper"
              >
                <div>
                  <div className="text-[14.5px] font-medium text-ink">{o.baslik}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    {o.il} · {o.yil} · {o.olusturuldu.slice(0, 10)}
                  </div>
                </div>
                <span className="border border-hairline bg-paper px-[9px] py-[5px] text-center font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute">
                  {ONERI_DURUM_ETIKET[o.durum]}
                </span>
                <EvidenceBand
                  value={o.kanit}
                  state={o.kanit >= 55 ? "verified" : o.kanit > 0 ? "unverified" : "absent"}
                  size="tablo"
                  durum={o.kanit >= 55 ? "eşiği geçti" : "eşik altı"}
                  durumSinifi={o.kanit >= 55 ? "text-verified" : "text-unverif"}
                />
                <div className="text-right">
                  <span className="num text-[16px] text-ink-soft">{o.destek}</span>
                  <div className="text-[11px] text-ink-mute">destek · puan değil</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
