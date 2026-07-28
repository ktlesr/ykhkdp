import Link from "next/link";
import { notFound } from "next/navigation";
import { adayDetay, adayTabanPuani, donemGetir } from "@ykh/database";
import { DOGRULAMA_ETIKET, epistemik, type DogrulamaDurumu } from "@ykh/domain";
import { GRUP_ACIKLAMA, GRUP_ETIKET, gruplaraGore, KRITER_ETIKET, type Kriter } from "@ykh/scoring";
import { EvidenceBand } from "@/components/evidence-band.tsx";
import { EP } from "@/components/epistemic-frame.tsx";
import { KunyeCekmecesi } from "@/components/kunye-cekmecesi.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Blok 2 — İddia-Kanıt Matrisi.
 *
 * §1.1: dört ölçüt asla birleştirilmez. Bu sayfada stratejik puan kırılımı ve
 * kanıt yeterliliği iki ayrı görsel dilde durur; tek bir "genel skor" yok.
 */

const ETIKET = "font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-mute";

export default async function Blok2({
  params,
}: {
  params: Promise<{ il: string; donem: string; id: string }>;
}) {
  const { il, donem, id } = await params;
  const b = await baglam();
  const k = await kullanici();

  const d = await donemGetir(b, il, donem);
  if (!d) notFound();
  const detay = await adayDetay(b, Number(id));
  if (!detay) notFound();

  const { aday, kriterler, iddialar, kanitlar, destek } = detay;
  const yol = `/il/${il}/donem/${donem}`;

  const onayli = kanitlar.filter((x) => x.dogrulamaDurumu === "uzman_onayli");
  const kanitPuani = Math.min(100, onayli.reduce((t, x) => t + x.katkiPuani, 0));
  const ep = kanitPuani >= d.set.kanitEsigi ? "onay" : kanitlar.length > onayli.length ? "ai" : "yok";

  const puanlar = new Map(kriterler.map((x) => [x.kriter, x]));
  // Toplam herkese aynı görünür; kırılım RLS altında (kurum içi).
  const taban = await adayTabanPuani(b, Number(id), d.set);
  const kirilimGorunur = kriterler.length > 0;

  return (
    <>
      <UstBar
        surum={d.set.surum}
        kilitli={d.durum === "kilitli"}
        kullanici={k}
        nav={[
          { ad: "İl karar ekranı", yol },
          { ad: "Konu detayı", yol: `${yol}/konu/${id}`, aktif: true },
          { ad: "İnceleme", yol: `${yol}/inceleme` },
        ]}
      />

      <section className="mx-auto max-w-[1440px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
            Blok 2 · iddia-kanıt matrisi
          </div>
          <h1 className="max-w-[24ch] font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">
            {aday.ad}
          </h1>
          <div className="mt-2.5 flex items-center gap-3.5 font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute">
            <span>{aday.nace}</span>
            <span aria-hidden>·</span>
            <span className={EP[ep].yazi}>
              <span aria-hidden>{EP[ep].isaret}</span> {EP[ep].etiket}
            </span>
            <span aria-hidden>·</span>
            <span>{aday.koken === "mevcut" ? "Mevcut konu" : "Yeni öneri"}</span>
          </div>
        </div>

        {/* §1.1 — dört ölçüt, dört ayrı kutu. Birleştirilmiş halka yok. */}
        <div className="grid grid-cols-[1fr_1fr_1fr] border border-t-0 border-hairline bg-surface">
          <div className="border-r border-r-hairline-soft px-5 py-4">
            <div className={ETIKET}>Stratejik puan</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="num text-[28px] leading-none">{taban}</span>
              <span className="text-[11.5px] text-ink-mute">/100 · sekiz kriter ağırlıklı</span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-ink-mute">
              {aday.koken === "mevcut" && d.set.devamlilikPayi > 0
                ? `sıralamada +${d.set.devamlilikPayi} devamlılık payı eklenir`
                : "devamlılık payı yok"}
            </div>
          </div>

          <div className="border-r border-r-hairline-soft px-5 py-4">
            <div className={ETIKET}>Kanıt yeterliliği</div>
            <div className="mt-2">
              <EvidenceBand
                value={kanitPuani}
                state={ep === "onay" ? "verified" : ep === "ai" ? "unverified" : "absent"}
                size="oneri"
                durum={kanitPuani >= d.set.kanitEsigi ? "eşiği geçti" : "eşik altı"}
                durumSinifi={kanitPuani >= d.set.kanitEsigi ? "text-verified" : "text-unverif"}
              />
            </div>
            <div className="mt-1.5 font-mono text-[10px] text-ink-mute">eşik {d.set.kanitEsigi}/100</div>
          </div>

          <div className="px-5 py-4">
            <div className={ETIKET}>Destek · ilgi sinyali</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="num text-[28px] leading-none text-ink-soft">{destek}</span>
              <span className="text-[11.5px] text-ink-mute">kişi</span>
            </div>
            <div className="mt-1 text-[11.5px] leading-[1.4] text-ink-mute">
              Destek sayısı <b>puan girdisi değildir</b>.
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[minmax(600px,1fr)_400px] items-start gap-6">
          {/* iddia → kanıt matrisi */}
          <div className="border border-hairline bg-surface">
            <div className="border-b-2 border-b-ink bg-paper px-[18px] py-3">
              <span className="font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                İddialar ve dayandıkları kanıt
              </span>
            </div>

            {iddialar.length === 0 && (
              <div className="tex-absent border-l-[3px] [border-left-style:dotted] border-l-absent px-[18px] py-5">
                <div className="text-[14px] font-medium text-ink">Bu konuda henüz atomik iddia yok.</div>
                <p className="mt-1.5 text-[13px] text-ink-soft">
                  Uzman incelemesi iddiaları çıkardığında burada görünür ve her biri kanıta bağlanır.
                </p>
              </div>
            )}

            {iddialar.map((iddia) => {
              const bagli = kanitlar.filter((x) => x.iddia_id === iddia.id);
              return (
                <div key={iddia.id} className="border-b border-b-[#E9E5DB] px-[18px] py-4 last:border-b-0">
                  <div className="text-[14.5px] leading-[1.4] font-medium text-ink text-pretty">{iddia.metin}</div>
                  <div className="mt-3 space-y-2">
                    {bagli.length === 0 && (
                      <div className="tex-absent border-l-[3px] [border-left-style:dotted] border-l-absent px-3 py-2.5 text-[12.5px] text-ink-soft">
                        <span aria-hidden>—</span> Kanıt yok / yetersiz — bu iddia slot dolduramaz.
                      </div>
                    )}
                    {bagli.map((x) => {
                      const e = EP[epistemik(x.dogrulamaDurumu as DogrulamaDurumu)];
                      return (
                        <div
                          key={x.id}
                          className={cn("flex items-start gap-3 border border-hairline-soft px-3 py-2.5", e.kenar, e.doku)}
                        >
                          <span className={cn("font-mono text-[13px]", e.yazi)} aria-hidden>
                            {e.isaret}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-ink">{x.belge}</div>
                            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                              {x.kaynakKurum}
                              {x.sayfaTablo && ` · ${x.sayfaTablo}`}
                            </div>
                            <div className={cn("mt-1 font-mono text-[10px] uppercase tracking-[.08em]", e.yazi)}>
                              {DOGRULAMA_ETIKET[x.dogrulamaDurumu as DogrulamaDurumu]}
                              {x.dogrulamaDurumu === "uzman_onayli"
                                ? ` · +${x.katkiPuani} puan`
                                : " · puana girmez"}
                            </div>
                          </div>
                          <KunyeCekmecesi kunye={{ ...x, iddia: iddia.metin }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* kriter kırılımı */}
          <div className="border border-hairline bg-surface">
            <div className="border-b-2 border-b-ink bg-paper px-[18px] py-3">
              <span className="font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                Kriter kırılımı · ağırlık seti {d.set.surum}
              </span>
            </div>
            {!kirilimGorunur && (
              <div className="tex-absent border-l-[3px] [border-left-style:dotted] border-l-absent px-[18px] py-4">
                <div className="text-[13.5px] font-medium text-ink">Kriter kırılımı bu görünümde kapalı.</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
                  Yayımlanan karar stratejik puanın <b>toplamını</b> taşır; kriter kırılımı ve değerlendirici
                  gerekçesi kurum içi veridir. Toplam puan her görünümde aynıdır — sıralama değişmez.
                </p>
              </div>
            )}
            {kirilimGorunur &&
              gruplaraGore(d.set.agirliklar).map(({ grup, agirlik, kriterler: grupKriterleri }) => (
                <div key={grup} className="border-b border-b-ink last:border-b-0">
                  {/* Grup başlığı — "Neden burada?" en ağır grup olarak vurgulanır */}
                  <div
                    className={cn(
                      "flex items-baseline justify-between gap-3 px-[18px] py-2.5",
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
                      %{(agirlik * 100).toFixed(0)}
                    </span>
                  </div>

                  {grup === "yerellik" && (
                    <p className="border-b border-b-[#E9E5DB] bg-paper px-[18px] py-2.5 text-[12px] leading-[1.45] text-ink-soft">
                      {GRUP_ACIKLAMA.yerellik}
                    </p>
                  )}

                  {grupKriterleri.map((kr) => {
                    const p = puanlar.get(kr);
                    const dogrulandi = p?.dogrulandi ?? false;
                    return (
                      <div key={kr} className="border-b border-b-[#E9E5DB] px-[18px] py-3 last:border-b-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[12.5px] leading-[1.35] text-ink-soft">{KRITER_ETIKET[kr]}</span>
                          <span className={cn("num text-[14px]", dogrulandi ? "text-ink" : "text-unverif")}>
                            {dogrulandi ? p!.puan : "—"}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-[7px] flex-1 border border-hairline bg-surface">
                            <div
                              className={cn("h-full", dogrulandi ? "bg-ink" : "tex-unverified")}
                              style={{ width: `${dogrulandi ? p!.puan : 100}%` }}
                            />
                          </div>
                          <span className="num text-[10px] text-ink-mute">
                            ağırlık {(d.set.agirliklar[kr] * 100).toFixed(0)}%
                          </span>
                        </div>
                        {!dogrulandi && (
                          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[.08em] text-unverif">
                            <span aria-hidden>◌</span> Doğrulanmadı — puana 0 girer
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Link
            href={yol}
            className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
          >
            Karar ekranına dön
          </Link>
          {aday.oneri_id && (
            <Link
              href={`/oneri/${aday.oneri_id}`}
              className="border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
            >
              Öneri dosyasını aç
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
