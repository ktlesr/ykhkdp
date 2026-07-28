import Link from "next/link";
import { notFound } from "next/navigation";
import { donemGetir, incelemeKuyrugu, islem } from "@ykh/database";
import { DOGRULAMA_ETIKET, ONERI_DURUM_ETIKET, olasiGecisler, type DogrulamaDurumu, type OneriDurumu } from "@ykh/domain";
import { EP } from "@/components/epistemic-frame.tsx";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { kanitDogrulaEylemi, oneriDurumEylemi } from "@/lib/eylem.ts";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Blok 4 — Uzman İncelemesi.
 *
 * §1.3 tek geçit: kanıt buradan "uzman onaylı" olmadan puana giremez.
 * AI bulgusu ekranda görünür ama ayrı işaretlenir.
 */
export default async function Blok4({ params }: { params: Promise<{ il: string; donem: string }> }) {
  const { il, donem } = await params;
  const b = await baglam();
  const k = await kullanici();

  const d = await donemGetir(b, il, donem);
  if (!d) notFound();

  const yol = `/il/${il}/donem/${donem}/inceleme`;
  const uzman = k?.rol === "ajans_uzmani" || k?.rol === "sektor_uzmani";
  const kuyruk = uzman ? await incelemeKuyrugu(b, d.donemId) : [];
  const oneriler = uzman
    ? await islem(b, (sql) =>
        sql<{ id: number; baslik: string; durum: OneriDurumu }[]>`
          select id, baslik, durum from oneri
          where donem_id = ${d.donemId} and durum in ('kanit_bekliyor','triyaj','uzman_incelemesinde','revizyon_istendi')
          order by olusturuldu
        `,
      )
    : [];

  return (
    <>
      <UstBar
        surum={d.set.surum}
        kilitli={d.durum === "kilitli"}
        kullanici={k}
        nav={[
          { ad: "İl karar ekranı", yol: `/il/${il}/donem/${donem}` },
          { ad: "İnceleme", yol, aktif: true },
        ]}
      />

      <section className="mx-auto max-w-[1440px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[26px] pb-4">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
            Blok 4 · uzman incelemesi
          </div>
          <h1 className="font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">
            {d.il} · {d.yil} — kanıt doğrulama kuyruğu
          </h1>
          <p className="mt-2 max-w-[78ch] text-[14px] text-ink-soft text-pretty">
            Puanlamaya <b>yalnızca uzman onaylı kanıt</b> girer. Bu ekran o tek geçittir: onaylanmayan kanıt ekranda
            görünmeye devam eder ama sıralamayı etkilemez.
          </p>
        </div>

        {!uzman ? (
          <div className="tex-absent mt-6 border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-4">
            <div className="text-[14.5px] font-medium text-ink">Bu ekran ajans ve sektör uzmanlarına açık.</div>
            <p className="mt-1.5 max-w-[70ch] text-[13px] text-ink-soft">
              Yetkili roller davetle atanır. Kanıt doğrulama yetkisi olmayan bir hesapla bu kuyruk görüntülenemez —
              bu kural veritabanı düzeyinde de uygulanır.
            </p>
            <Link
              href={`/il/${il}/donem/${donem}`}
              className="mt-3 inline-block border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
            >
              Karar ekranına dön
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-[minmax(640px,1fr)_380px] items-start gap-6 max-[1100px]:grid-cols-1">
            <div className="border border-hairline bg-surface">
              <div className="border-b-2 border-b-ink bg-paper px-[18px] py-3">
                <span className="font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                  Doğrulama bekleyen kanıt ({kuyruk.length})
                </span>
              </div>

              {kuyruk.length === 0 ? (
                <div className="px-[18px] py-6">
                  <div className="text-[14.5px] font-medium text-ink">Kuyruk boş — bekleyen kanıt yok.</div>
                  <p className="mt-1.5 text-[13px] text-ink-soft">
                    Yeni kanıt eklendiğinde burada belirir. Kanıt talebi açmak için öneri dosyasına gidin.
                  </p>
                </div>
              ) : (
                kuyruk.map((x) => {
                  const e = EP[x.dogrulama_durumu === "uzman_onayli" ? "onay" : "ai"];
                  return (
                    <div key={x.id} className="border-b border-b-[#E9E5DB] px-[18px] py-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <span className={cn("font-mono text-[13px]", e.yazi)} aria-hidden>
                          {e.isaret}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-medium text-ink">{x.belge}</div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                            {x.kod} · {x.kaynak_kurum} · iddia katkısı {x.katki_puani} puan
                          </div>
                          <div className={cn("mt-1 font-mono text-[10px] uppercase tracking-[.08em]", e.yazi)}>
                            {DOGRULAMA_ETIKET[x.dogrulama_durumu as DogrulamaDurumu]} · puana girmez
                          </div>
                          {x.alinti && (
                            <blockquote className="mt-2 border-l-2 border-l-ink pl-3 font-display text-[14px] leading-[1.55] text-ink-soft text-pretty">
                              “{x.alinti}”
                            </blockquote>
                          )}
                          {x.aday_ad && (
                            <div className="mt-1.5 text-[12px] text-ink-mute">Konu: {x.aday_ad}</div>
                          )}
                        </div>
                      </div>

                      <EylemFormu eylem={kanitDogrulaEylemi} className="mt-3" surum={d.set.surum}>
                        <input type="hidden" name="kanitId" value={x.id} />
                        <input type="hidden" name="yol" value={yol} />
                        <label className="sr-only" htmlFor={`gerekce-${x.id}`}>
                          Gerekçe
                        </label>
                        <textarea
                          id={`gerekce-${x.id}`}
                          name="gerekce"
                          rows={2}
                          placeholder="Gerekçe — ret ve çelişki için zorunlu (en az 10 karakter)."
                          className="w-full resize-y border border-hairline bg-[#FDFCFA] px-3 py-2.5 text-[13px] leading-[1.5] text-ink"
                        />
                        <div className="mt-2.5 flex flex-wrap gap-2.5">
                          <button
                            type="submit"
                            name="durum"
                            value="uzman_onayli"
                            className="min-h-11 cursor-pointer border border-verified-line bg-verified-tint px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-verified"
                          >
                            Kanıtı onayla · +{x.katki_puani} puan
                          </button>
                          <button
                            type="submit"
                            name="durum"
                            value="celiskili"
                            className="min-h-11 cursor-pointer border border-unverif-line bg-unverif-tint px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-unverif"
                          >
                            Çelişkili işaretle
                          </button>
                          <button
                            type="submit"
                            name="durum"
                            value="reddedildi"
                            className="min-h-11 cursor-pointer border border-conflict-line bg-conflict-tint px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-conflict"
                          >
                            Kanıtı reddet
                          </button>
                        </div>
                      </EylemFormu>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border border-hairline bg-surface">
              <div className="border-b-2 border-b-ink bg-paper px-[18px] py-3">
                <span className="font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                  Öneri triyajı ({oneriler.length})
                </span>
              </div>
              {oneriler.length === 0 ? (
                <p className="px-[18px] py-5 text-[13px] text-ink-soft">Bekleyen öneri yok.</p>
              ) : (
                oneriler.map((o) => {
                  const gecisler = olasiGecisler(o.durum, k!.rol, false);
                  return (
                    <div key={o.id} className="border-b border-b-[#E9E5DB] px-[18px] py-3.5 last:border-b-0">
                      <Link href={`/oneri/${o.id}`} className="text-[13.5px] font-medium text-ink">
                        {o.baslik}
                      </Link>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                        {ONERI_DURUM_ETIKET[o.durum]}
                      </div>
                      {gecisler.length > 0 && (
                        <EylemFormu eylem={oneriDurumEylemi} className="mt-2.5" surum={d.set.surum}>
                          <input type="hidden" name="oneriId" value={o.id} />
                          <input type="hidden" name="yol" value={yol} />
                          <textarea
                            name="gerekce"
                            rows={2}
                            placeholder="Gerekçe zorunlu (en az 10 karakter)."
                            className="w-full resize-y border border-hairline bg-[#FDFCFA] px-3 py-2 text-[12.5px] leading-[1.5] text-ink"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            {gecisler.map((g) => (
                              <button
                                key={g.to}
                                type="submit"
                                name="durum"
                                value={g.to}
                                className="min-h-11 cursor-pointer border border-hairline px-2.5 py-2 font-mono text-[10px] uppercase tracking-[.09em] text-ink"
                              >
                                {g.eylem}
                              </button>
                            ))}
                          </div>
                        </EylemFormu>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
