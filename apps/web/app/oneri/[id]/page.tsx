import Link from "next/link";
import { notFound } from "next/navigation";
import { oneriGetir } from "@ykh/database";
import { DOGRULAMA_ETIKET, epistemik, ONERI_DURUM_ETIKET, type DogrulamaDurumu } from "@ykh/domain";
import { EvidenceBand } from "@/components/evidence-band.tsx";
import { EP } from "@/components/epistemic-frame.tsx";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { DestekDugmesi } from "@/components/destek-dugmesi.tsx";
import { KunyeCekmecesi } from "@/components/kunye-cekmecesi.tsx";
import { UstBar } from "@/components/ust-bar.tsx";
import { kanitEkleEylemi } from "@/lib/eylem.ts";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { cn } from "@/lib/utils.ts";

/** Blok 3 · Kademe 2 — dosya güçlendirme. Kanıt kartı bu ekranın yıldızı. */

const ETIKET = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[.12em] text-ink-mute";
const GIRDI = "min-h-11 w-full border border-hairline bg-[#FDFCFA] px-3 py-2.5 text-[13.5px] text-ink";

export default async function OneriDosyasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await baglam();
  const k = await kullanici();

  const o = await oneriGetir(b, Number(id));
  if (!o) notFound();

  const sahip = k?.ref === o.gonderen_ref;
  const onayli = o.kanitlar.filter((x) => x.dogrulamaDurumu === "uzman_onayli");
  const puan = Math.min(100, onayli.reduce((t, x) => t + x.katkiPuani, 0));
  const yol = `/oneri/${id}`;

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "Panom", yol: "/panom" },
          { ad: "İl karar ekranı", yol: `/il/${o.il_kod}/donem/${o.yil}` },
        ]}
      />

      <section className="mx-auto max-w-[1100px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[26px] pb-4">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">
            Öneri dosyası · {o.il} · {o.yil}
          </div>
          <h1 className="max-w-[28ch] font-display text-[29px] leading-[1.12] font-medium tracking-[-.01em]">
            {o.baslik}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-3.5 font-mono text-[10px] uppercase tracking-[.09em] text-ink-mute">
            <span className="border border-hairline bg-surface px-[9px] py-[5px]">
              {ONERI_DURUM_ETIKET[o.durum]}
            </span>
            {o.nace && <span>{o.nace_onayli ? `${o.nace} · onaylı` : `${o.nace} · doğrulanmadı`}</span>}
            {o.ilce && <span>{o.ilce}</span>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1.25fr_1fr] items-start gap-5 max-[900px]:grid-cols-1">
          <div>
            {/* kanıt yeterliliği */}
            <div className="border border-hairline bg-surface">
              <div className="flex items-center gap-[18px] border-b border-b-hairline-soft bg-[#FDFCFA] px-5 py-[18px]">
                <div>
                  <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                    Kanıt yeterliliği · yalnızca uzman onaylı kanıt sayılır
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <EvidenceBand
                      value={puan}
                      state={puan >= 55 ? "verified" : o.kanitlar.length ? "unverified" : "absent"}
                      size="oneri"
                      sessiz
                    />
                    <span className="num text-[26px] leading-none">{puan}</span>
                    <span className="num text-[12px] text-ink-mute">/100</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <span
                    className={cn(
                      "inline-block border px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[.11em]",
                      puan >= 55
                        ? "border-verified-line bg-verified-tint text-verified"
                        : "border-unverif-line bg-unverif-tint text-unverif",
                    )}
                  >
                    {puan >= 55 ? "Uzman incelemesine girebilir" : puan >= 35 ? "Kanıt eşiği altında" : "Kanıt bekliyor"}
                  </span>
                  <p className="mt-2 max-w-[42ch] text-[12.5px] leading-[1.45] text-ink-soft">
                    {puan >= 55
                      ? `Bu dosya sıralamaya girebilir. Kanıt yeterliliği ${puan}/100 — eşik 55.`
                      : `Bu öneri şu an kanıt yeterliliği düşük (${puan}/100, eşik 55). Eksikleri tamamlarsanız uzman incelemesine girer.`}
                  </p>
                </div>
              </div>

              {/* kanıt listesi */}
              <div className="px-5 py-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                  Dosyadaki kanıtlar ({o.kanitlar.length})
                </div>
                {o.kanitlar.length === 0 ? (
                  <div className="tex-absent border-l-[3px] [border-left-style:dotted] border-l-absent px-3.5 py-3.5">
                    <div className="text-[13.5px] font-medium text-ink">Henüz kanıt yok.</div>
                    <p className="mt-1 text-[12.5px] text-ink-soft">
                      Aşağıdaki kanıt kartıyla ilk kaynağınızı ekleyin — kaynak künyesi olmadan puan hesaplanmaz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {o.kanitlar.map((x) => {
                      const e = EP[epistemik(x.dogrulamaDurumu as DogrulamaDurumu)];
                      return (
                        <div
                          key={x.id}
                          className={cn(
                            "flex items-start gap-3 border border-hairline-soft px-3 py-2.5",
                            e.kenar,
                            e.doku,
                          )}
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
                              {x.dogrulamaDurumu === "uzman_onayli" ? ` · +${x.katkiPuani} puan` : " · puana girmez"}
                            </div>
                          </div>
                          <KunyeCekmecesi kunye={x} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* kanıt kartı */}
            {k && (
              <div className="mt-5 border border-ink bg-surface">
                <div className="flex items-center justify-between gap-3 border-b-2 border-b-ink bg-paper px-[18px] py-3">
                  <span className="font-mono text-[10px] uppercase tracking-[.13em] text-ink">
                    Kanıt kartı · kaynak künyesi zorunlu
                  </span>
                  <span className="font-mono text-[10px] text-ink-mute">KNT-yeni</span>
                </div>
                <EylemFormu eylem={kanitEkleEylemi} className="px-[18px] py-4">
                  <input type="hidden" name="oneriId" value={id} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={ETIKET} htmlFor="kaynakKurum">
                        Kaynak kurum
                      </label>
                      <input id="kaynakKurum" name="kaynakKurum" required className={GIRDI} />
                    </div>
                    <div>
                      <label className={ETIKET} htmlFor="belge">
                        Belge
                      </label>
                      <input id="belge" name="belge" required className={GIRDI} />
                    </div>
                    <div>
                      <label className={ETIKET} htmlFor="sayfaTablo">
                        Sayfa / tablo
                      </label>
                      <input id="sayfaTablo" name="sayfaTablo" placeholder="s. 34 · Tablo 6" className={GIRDI} />
                    </div>
                    <div>
                      <label className={ETIKET} htmlFor="yayimTarihi">
                        Yayım tarihi
                      </label>
                      <input id="yayimTarihi" name="yayimTarihi" type="date" className={GIRDI} />
                    </div>
                  </div>

                  <label className={`${ETIKET} mt-3`} htmlFor="url">
                    URL veya dosya
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://…"
                    className="min-h-11 w-full border border-dashed border-hairline bg-[repeating-linear-gradient(135deg,#FFF_0_6px,#F6F4EF_6px_12px)] px-3 py-2.5 font-mono text-[13px] text-ink"
                  />

                  <label className={`${ETIKET} mt-3`} htmlFor="alinti">
                    Kaynaktan alıntı
                  </label>
                  <textarea
                    id="alinti"
                    name="alinti"
                    rows={3}
                    className="w-full resize-y border border-hairline bg-[#FDFCFA] px-3 py-2.5 text-[13.5px] leading-[1.5] text-ink"
                  />

                  <label className={`${ETIKET} mt-3`} htmlFor="katkiPuani">
                    Kanıt yeterliliğine katkı iddiası · 0–100
                  </label>
                  <input
                    id="katkiPuani"
                    name="katkiPuani"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={14}
                    className="num min-h-11 w-[120px] border border-hairline bg-[#FDFCFA] px-3 py-2.5 text-[13.5px]"
                  />

                  <div className="mt-3.5 flex items-center gap-2.5 border border-hairline-soft bg-paper px-3 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-[.11em] text-ink-mute">Gizlilik</span>
                    <span className="text-[12.5px] text-ink-soft">
                      Kamuya açık künye · belge içeriği yalnızca uzmanlarda
                    </span>
                  </div>

                  <div className="mt-3.5 flex gap-2.5">
                    <Gonder>Kanıtı dosyaya ekle</Gonder>
                    <span className="flex min-h-11 items-center border border-hairline px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink-mute">
                      Eklenen kanıt “beyan” olarak girer · puana girmez
                    </span>
                  </div>
                </EylemFormu>
              </div>
            )}
          </div>

          {/* destek + pano */}
          <div>
            <div className="border border-hairline bg-surface p-[18px]">
              <div className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                Destek · ilgi sinyali
              </div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="num text-[30px] leading-none">{o.destek}</span>
                <span className="text-[12.5px] text-ink-mute">kişi bu dosyayı destekliyor</span>
              </div>
              <div className="tex-absent mt-3 border border-dotted border-absent px-3 py-2.5 text-[12.5px] leading-[1.45] text-ink-soft">
                Destek sayısı <b>puan girdisi değildir</b>. Sıralama yalnızca sekiz kriter ve uzman onaylı kanıtla
                hesaplanır; destek yalnızca ilgiyi gösterir.
              </div>
              {k && !sahip && <DestekDugmesi oneriId={Number(id)} yol={yol} />}
            </div>

            <div className="border border-t-0 border-hairline bg-[#FDFCFA] p-[18px]">
              <div className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                Öneri tanımı
              </div>
              <p className="text-[13px] leading-[1.55] text-ink-soft text-pretty">{o.tanim}</p>
              {o.neden && (
                <>
                  <div className="mt-3.5 mb-1.5 font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">
                    Neden burada?
                  </div>
                  <p className="text-[13px] leading-[1.55] text-ink-soft text-pretty">{o.neden}</p>
                </>
              )}
            </div>

            <div className="border border-t-0 border-hairline bg-surface p-[18px]">
              <Link
                href={`/il/${o.il_kod}/donem/${o.yil}`}
                className="block border border-hairline px-[13px] py-[9px] text-center font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
              >
                {o.il} {o.yil} karar ekranı
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
