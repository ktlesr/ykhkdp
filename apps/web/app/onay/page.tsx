import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { kuyrukKopyalari, onayKuyrugu } from "@ykh/database";
import { onaylayabilir } from "@ykh/domain";
import { AsamaRozeti } from "@/components/degerlendirme-durumu.tsx";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { KAPALI } from "@/lib/site.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Ajans onay kuyruğu — AI puanladı, karar bekliyor.
 *
 * BÖLGE → İL gruplu ve süzülebilir. Önceden bütün iller tek listede, uzun
 * gerekçe ve AI metniyle karışık akıyordu; hangi önerinin hangi ilde, ne
 * zaman ve hangi yolla geldiği takip edilemiyordu. Satır yalnızca karar için
 * gerekeni söyler (ne · nerede · ne zaman · hangi yolla · dayanak · durum);
 * gerekçe, alıntılar ve karşı görüş öneri kaydında.
 *
 * ARAMA MOTORUNA VE PAYLAŞIM KARTINA KAPALI; başlık içerikten türemez.
 */
export const metadata: Metadata = { title: "Onay kuyruğu", robots: KAPALI };

type Satir = Awaited<ReturnType<typeof onayKuyrugu>>[number];

/** "Hangi yolla önerildi" — ajansın ilk sorusu. */
function yol(o: Satir): string {
  if (o.koken === "mevcut") return "Resmî konu";
  if (o.resmi_yillar) return `Önceki resmî konu · ${o.resmi_yillar}`;
  if (o.kesif_id) return "Belgelerden keşif";
  if (o.gonderen_rol === "ajans" || o.gonderen_rol === "yonetici") return "Ajans puanlattı";
  if (o.misafir) return "Misafir yatırımcı";
  return "Yatırımcı";
}

export default async function Onay({ searchParams }: { searchParams: Promise<{ bolge?: string; il?: string }> }) {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fonay");
  if (!onaylayabilir(k.rol)) redirect("/oneri");
  const { bolge, il } = await searchParams;

  const b = await baglam();
  const [tumu, kopyalar] = await Promise.all([onayKuyrugu(b), kuyrukKopyalari(b)]);

  // Süzgeç seçenekleri kuyruktan türer: boş bölge/il listelenmez.
  const bolgeler = [...new Map(tumu.map((o) => [o.ajans_kod, { kod: o.ajans_kod, ad: o.ajans, kisa: o.kisa_ad }])).values()];
  const iller = [...new Map(tumu.filter((o) => !bolge || o.ajans_kod === bolge).map((o) => [o.il_kod, { kod: o.il_kod, ad: o.il }])).values()];
  const kuyruk = tumu.filter((o) => (!bolge || o.ajans_kod === bolge) && (!il || o.il_kod === il));
  const bekleyen = kuyruk.filter((o) => o.durum === "onay_bekliyor").length;

  // Bölge → il grupları (sorgu bu sırayla geliyor).
  const gruplar = new Map<string, { ad: string; kisa: string | null; iller: Map<string, { ad: string; satirlar: Satir[] }> }>();
  for (const o of kuyruk) {
    const g = gruplar.get(o.ajans_kod) ?? { ad: o.ajans, kisa: o.kisa_ad, iller: new Map() };
    const i = g.iller.get(o.il_kod) ?? { ad: o.il, satirlar: [] };
    i.satirlar.push(o);
    g.iller.set(o.il_kod, i);
    gruplar.set(o.ajans_kod, g);
  }

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: "Onay", yol: "/onay", aktif: true },
          { ad: "Belgeler", yol: "/belgeler" },
          { ad: "Ayarlar", yol: "/ayarlar" },
        ]}
      />
      <Sayfa genis>
        <Baslik alt="Yapay zekâ puanladı, puan doğrulanmadı. Onaylanmadan hiçbir öneri il sıralamasına girmez; onay geri alınabilir.">
          Onay kuyruğu
        </Baslik>

        {/* Süzgeç — sade GET formu: bağlantı paylaşılabilir, JavaScript gerekmez. */}
        <form method="get" className="mt-6 flex flex-wrap items-end gap-3 border border-hairline bg-surface px-4 py-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span className="etiket text-ink-mute">Bölge</span>
            <select name="bolge" defaultValue={bolge ?? ""} className="min-h-11 border border-hairline bg-alan px-3 text-[15px] text-ink">
              <option value="">Bütün bölgeler</option>
              {bolgeler.map((x) => (
                <option key={x.kod} value={x.kod}>
                  {x.ad}
                  {x.kisa ? ` · ${x.kisa}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="etiket text-ink-mute">İl</span>
            <select name="il" defaultValue={il ?? ""} className="min-h-11 border border-hairline bg-alan px-3 text-[15px] text-ink">
              <option value="">{bolge ? "Bölgedeki bütün iller" : "Bütün iller"}</option>
              {iller.map((x) => (
                <option key={x.kod} value={x.kod}>
                  {x.ad}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="etiket-l min-h-11 border border-navy bg-navy px-4 text-white hover:bg-[color-mix(in_oklab,var(--color-navy)_86%,black)]">
            Göster
          </button>
          {(bolge || il) && (
            <Link href="/onay" className="inline-flex min-h-11 items-center px-2 text-[13.5px] text-ink-soft underline decoration-hairline underline-offset-2 hover:text-ink">
              Süzgeci kaldır
            </Link>
          )}
        </form>

        <p className="mt-3 text-[13.5px] text-ink-soft">
          <span className="num font-medium text-ink">{kuyruk.length}</span> öneri ·{" "}
          <span className="num font-medium text-unverif">{bekleyen}</span> kararınızı bekliyor ·{" "}
          <span className="num font-medium text-navy">{kuyruk.length - bekleyen}</span> değerlendiriliyor
          {gruplar.size > 1 && (
            <>
              {" "}
              · <span className="num">{gruplar.size}</span> bölge
            </>
          )}
        </p>

        {kuyruk.length === 0 ? (
          <Bos baslik={bolge || il ? "Bu süzgeçte bekleyen öneri yok." : "Kuyruk boş."}>
            Yeni bir öneri geldiğinde yapay zekâ puanlar ve burada kararınıza düşer.
          </Bos>
        ) : (
          [...gruplar].map(([kod, g]) => (
            <section key={kod} className="mt-6">
              <h2 className="flex flex-wrap items-baseline gap-x-3 text-[18px] font-semibold tracking-[-.01em] text-ink">
                {g.ad}
                <span className="num etiket font-normal text-ink-mute">
                  {kod}
                  {g.kisa ? ` · ${g.kisa}` : ""} · {[...g.iller.values()].reduce((t, i) => t + i.satirlar.length, 0)} öneri
                </span>
              </h2>

              {[...g.iller].map(([ilKod, i]) => (
                <div key={ilKod} className="mt-3 border border-hairline bg-surface">
                  <div className="serit flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                    <span className="text-[15px] font-semibold text-ink">
                      {i.ad} <span className="num ml-1 text-[13.5px] font-normal text-ink-mute">{i.satirlar.length}</span>
                    </span>
                    <Link href={`/il/${ilKod}`} className="etiket text-ink-soft underline decoration-hairline underline-offset-2 hover:text-ink">
                      {i.ad} il sayfası
                    </Link>
                  </div>

                  {i.satirlar.map((o) => {
                    const benzer = kopyalar.get(Number(o.id)) ?? [];
                    return (
                      <Link
                        key={o.id}
                        href={`/oneri/${o.id}`}
                        className="grid grid-cols-[56px_minmax(0,1fr)_150px_160px] items-start gap-x-4 gap-y-2 border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0 hover:bg-paper max-[860px]:grid-cols-[minmax(0,1fr)]"
                      >
                        <span className="num pt-0.5 text-[13.5px] text-ink-mute max-[860px]:hidden">#{o.id}</span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-medium leading-[1.35] text-ink text-pretty [overflow-wrap:anywhere]">
                            {o.baslik}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 etiket text-ink-mute">
                            <span className="num min-[861px]:hidden">#{o.id}</span>
                            <span className="num">{o.gonderildi}</span>
                            <span className="text-ink-soft">{yol(o)}</span>
                            {o.ilce && <span>{o.ilce}</span>}
                            {o.nace_kod && <span className="num">NACE {o.nace_kod}</span>}
                            {benzer.length > 0 && (
                              <span className="text-unverif">
                                ◌ benzer başlık: {benzer.map((y) => `#${y.id}`).join(", ")}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="text-[13.5px] text-ink-soft">
                          {o.ai_gerekce === null ? (
                            <span className="text-ink-mute">dayanak henüz yok</span>
                          ) : (
                            <>
                              dayanak{" "}
                              <span className={cn("num font-medium", o.dayanak >= o.dayanak_esigi ? "text-ink" : "text-unverif")}>
                                {o.dayanak}
                              </span>
                              <span className="num text-ink-mute">/100</span>
                              {o.dayanak < o.dayanak_esigi && <span className="block etiket text-unverif">eşik {o.dayanak_esigi} altında</span>}
                            </>
                          )}
                        </span>
                        <span className="flex justify-end max-[860px]:justify-start">
                          {o.durum === "degerlendiriliyor" ? (
                            <AsamaRozeti asama={o.asama} hatali={o.hatali} />
                          ) : (
                            <Rozet tur="amber" isaret="◌">
                              karar bekliyor
                            </Rozet>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </section>
          ))
        )}

        <div className="mt-8">
          <Bag href="/belgeler">Üst ölçekli belgeleri yönet</Bag>
        </div>
      </Sayfa>
    </>
  );
}
