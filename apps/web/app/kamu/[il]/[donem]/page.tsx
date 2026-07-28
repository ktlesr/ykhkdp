import Link from "next/link";
import { notFound } from "next/navigation";
import { adaylariGetir, donemGetir, kararGetir } from "@ykh/database";
import { DONEM_ETIKET, saltOkunur } from "@ykh/domain";
import { ayardan, hesapla } from "@ykh/scoring";
import { EvidenceBand } from "@/components/evidence-band.tsx";
import { EP, EpistemicFrame } from "@/components/epistemic-frame.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { ANONIM_BAGLAM } from "@/lib/kamu.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Kamu portalı. ANONİM bağlamla okur — oturum açmış bir uzman baksa bile
 * burada yalnızca kamuya açık veri görünür, çünkü sorgu `ANONIM` ile çalışır.
 * Epistemik gramer birebir aynıdır (§4).
 */
export default async function Kamu({ params }: { params: Promise<{ il: string; donem: string }> }) {
  const { il, donem } = await params;
  const b = ANONIM_BAGLAM;

  const d = await donemGetir(b, il, donem);
  if (!d) notFound();

  const adaylar = await adaylariGetir(b, d);
  const h = hesapla(adaylar, ayardan(d.set));
  const karar = await kararGetir(b, d.donemId);

  return (
    <>
      <UstBar surum={d.set.surum} kilitli={saltOkunur(d.durum)} />
      <section className="mx-auto max-w-[1000px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
            Kamuya açık yayım · {DONEM_ETIKET[d.durum]}
          </div>
          <h1 className="font-display text-[40px] leading-[1.06] font-medium tracking-[-.01em]">
            {d.il} — {d.yil} dönemi yatırım konuları
          </h1>
          <p className="mt-2.5 max-w-[70ch] text-[14px] text-ink-soft text-pretty">
            {d.set.slotSayisi} slot. Mevcut konular ve yeni öneriler aynı sekiz kriterle sıralandı. Mevcut konulara
            <b className="num"> +{h.pay}</b> puan devamlılık payı uygulandı — gizli katsayı yoktur, sürüm{" "}
            {d.set.surum}. Sıralama yalnızca uzman onaylı kanıtla hesaplanır.
          </p>
        </div>

        {karar && (
          <div className="mt-5 border border-verified-line border-l-[3px] border-l-verified bg-verified-tint px-4 py-3.5">
            <div className="text-[13.5px] font-semibold text-verified">
              Kurul kararı {karar.kilit_zamani.slice(0, 10)} tarihinde kilitlendi.
            </div>
            <p className="mt-1 text-[13px] text-ink-soft">
              Sürüm {karar.surum}. Değişiklik ancak yeni bir sürüm açılarak yapılır ve gerekçesi kamuya açık kayda geçer.
            </p>
          </div>
        )}

        <div className="mt-5 border border-hairline bg-surface">
          <div className="grid grid-cols-[52px_1fr_120px_140px_130px] bg-ink px-[22px] py-[9px] font-mono text-[9.5px] uppercase tracking-[.13em] text-[#C9CDD3]">
            <div>Sıra</div>
            <div>Yatırım konusu</div>
            <div className="text-right">Stratejik</div>
            <div>Kanıt yeterliliği</div>
            <div>Sonuç</div>
          </div>

          {h.ilkDort.map((s) =>
            s.bos ? (
              <div
                key={s.sira}
                className="tex-slot grid grid-cols-[52px_1fr] items-start gap-0 border-b border-b-[#E9E5DB] border-l-[3px] [border-left-style:dotted] border-l-absent px-[22px] py-[18px]"
              >
                <div className="num font-display text-[22px] text-absent">{s.sira}</div>
                <div>
                  <div className="text-[14.5px] font-medium text-ink-soft">
                    Slot boş — bu slot için yeterli kanıtlı aday yok.
                  </div>
                  <p className="mt-2 max-w-[80ch] text-[13px] text-ink-soft text-pretty">{s.gerekce}</p>
                </div>
              </div>
            ) : (
              <EpistemicFrame
                key={s.id}
                state={s.ep}
                dokusuz
                className="grid grid-cols-[52px_1fr_120px_140px_130px] items-center border-b border-b-[#E9E5DB] bg-surface px-[22px] py-[15px]"
              >
                <div className="num font-display text-[22px]">{s.sira}</div>
                <div className="pr-5">
                  <div className="text-[14.5px] leading-[1.32] font-medium text-ink text-pretty">{s.ad}</div>
                  <div className="mt-[5px] flex gap-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    <span>{s.nace}</span>
                    <span aria-hidden className="text-hairline">
                      ·
                    </span>
                    <span className={EP[s.ep].yazi}>
                      <span aria-hidden>{EP[s.ep].isaret}</span> {EP[s.ep].etiket}
                    </span>
                  </div>
                </div>
                <div className="num pr-4 text-right text-[19px]">{s.puan}</div>
                <EvidenceBand
                  value={s.kanit}
                  state={s.ep === "onay" ? "verified" : s.ep === "ai" ? "unverified" : "absent"}
                  durum={s.kanit >= h.esik ? "eşiği geçti" : "eşik altı"}
                  durumSinifi={s.kanit >= h.esik ? "text-verified" : "text-unverif"}
                />
                <div
                  className={cn(
                    "w-fit border px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[.09em]",
                    s.sonuc === "korunuyor"
                      ? "border-verified-line bg-verified-tint text-verified"
                      : "border-navy-line bg-navy-tint text-navy",
                  )}
                >
                  {s.sonuc}
                </div>
              </EpistemicFrame>
            ),
          )}
        </div>

        <div className="mt-5 flex items-center gap-4 border border-hairline bg-paper px-4 py-3.5">
          <p className="max-w-[64ch] text-[12.5px] text-ink-mute">
            Sıralama karar değildir; kararı il değerlendirme kurulu verir. AI bulguları puana girmez. Destek sayısı
            puan girdisi değildir. Öneri sahiplerinin kimliği bu sayfada gösterilmez.
          </p>
          <div className="ml-auto flex gap-2.5">
            <a
              href={`/kamu/${il}/${donem}/rapor`}
              className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
            >
              Yazdırılabilir rapor
            </a>
            <Link
              href={`/il/${il}/donem/${donem}/oneri`}
              className="border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
            >
              Öneri ver
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
