import { illeriListele } from "@ykh/database";
import { onaylayabilir } from "@ykh/domain";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/**
 * İl listesi — 81 il, ajans bölgesine göre katlanır gruplar.
 *
 * Düz listede ajans adı her satırda tekrar ediyordu ve 81 satır tek blok
 * hâlinde akıyordu. Gruplama bilgiyi taşıdığı yere koyar: ajans künyesi bir
 * kez başlıkta, il satırı yalnızca kendi durumunu gösterir.
 *
 * Katlama yerel `<details>` ile: JavaScript yok, klavye ve ekran okuyucu
 * desteği bedava. Açık dönemi olan bölgeler AÇIK gelir — varsayılan veriden
 * türetiliyor, keyfî değil: iş olan yer açık, olmayan yer kapalı.
 */
export default async function Iller() {
  const k = await kullanici();
  const iller = await illeriListele(await baglam());

  // `typeof iller` postgres.js'in RowList'i; gruplama düz dizi taşır.
  type IlSatiri = (typeof iller)[number];
  const bolgeler = iller.reduce<
    Array<{ kod: string; ad: string; kisaAd: string | null; iller: IlSatiri[] }>
  >((out, x) => {
    const b = out.find((y) => y.kod === x.ajans_kod);
    if (b) b.iller.push(x);
    else out.push({ kod: x.ajans_kod, ad: x.ajans, kisaAd: x.kisa_ad, iller: [x] });
    return out;
  }, []);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller", aktif: true },
          { ad: "Öneri ver", yol: "/oneri" },
          ...(k && onaylayabilir(k.rol)
            ? [
                { ad: "Onay", yol: "/onay" },
                { ad: "Belgeler", yol: "/belgeler" },
                ...(k.rol === "yonetici" ? [{ ad: "Ayarlar", yol: "/ayarlar" }] : []),
              ]
            : []),
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket="Yerel Kalkınma Hamlesi"
          alt="Her il için dört yatırım konusu. Öneriler yapay zekâ tarafından üst ölçekli belgelere ve sekiz kritere göre puanlanır, ajans onayından sonra listeye girer. Sıralama karar değildir. Açık dönemi olmayan illerde yürürlükteki resmî liste görülebilir."
        >
          İl bazında yatırım konusu önerileri
        </Baslik>

        {bolgeler.length === 0 ? (
          <Bos baslik="Henüz ajans kaydı yok.">Ajanslar yüklendiğinde iller burada listelenir.</Bos>
        ) : (
          <div className="mt-6 border border-hairline bg-surface">
            {bolgeler.map((b) => {
              const acikDonem = b.iller.filter((x) => x.yil).length;
              const listede = b.iller.reduce((t, x) => t + x.listede, 0);
              const bekleyen = b.iller.reduce((t, x) => t + x.bekleyen, 0);

              return (
                <details
                  key={b.kod}
                  open={acikDonem > 0}
                  className="katlanir border-b border-b-hairline last:border-b-0"
                >
                  <summary className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 bg-paper px-5 py-3.5">
                    <span aria-hidden className="katlanir-isaret shrink-0 text-[11px] text-ink-mute" />
                    <span className="num shrink-0 font-mono text-[11px] tracking-[.1em] text-ink-mute">
                      {b.kod}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-medium">
                      {b.ad}
                      {b.kisaAd && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">
                          {b.kisaAd}
                        </span>
                      )}
                    </span>

                    <span className="num shrink-0 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                      {b.iller.length} il
                    </span>
                    {acikDonem > 0 ? (
                      <Rozet tur="yesil" isaret="■">
                        {acikDonem} açık dönem
                      </Rozet>
                    ) : (
                      <Rozet tur="gri" isaret="—">
                        Açık dönem yok
                      </Rozet>
                    )}
                    {listede > 0 && <Rozet tur="notr">{listede} listede</Rozet>}
                    {bekleyen > 0 && (
                      <Rozet tur="amber" isaret="◌">
                        {bekleyen} onay bekliyor
                      </Rozet>
                    )}
                  </summary>

                  <div className="border-t border-t-hairline-soft">
                    {b.iller.map((x) => (
                      <div
                        key={x.il_kod}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-b-hairline-soft px-5 py-3.5 pl-11 last:border-b-0 max-[560px]:pl-5"
                      >
                        <span className="min-w-[150px] text-[14.5px] font-medium">
                          {x.il}
                          {x.yil && <span className="num ml-2 text-[12px] text-ink-mute">{x.yil}</span>}
                        </span>

                        <span className="flex flex-wrap items-center gap-2.5">
                          {x.yil ? (
                            <>
                              <Rozet tur={x.listede > 0 ? "yesil" : "gri"} isaret={x.listede > 0 ? "■" : "—"}>
                                {x.listede} listede
                              </Rozet>
                              {x.bekleyen > 0 && (
                                <Rozet tur="amber" isaret="◌">
                                  {x.bekleyen} onay bekliyor
                                </Rozet>
                              )}
                            </>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                              Açık dönem yok
                            </span>
                          )}
                          {x.resmi_konu > 0 && (
                            <span className="num font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                              {x.resmi_konu} resmî konu
                            </span>
                          )}
                        </span>

                        <span className="ml-auto flex gap-2.5">
                          {x.yil && <Bag href={`/oneri?il=${x.il_kod}`}>Öneri ver</Bag>}
                          <Bag varyant={x.yil ? "dolu" : "cizgi"} href={`/il/${x.il_kod}`}>
                            {x.yil ? "Sıralamayı gör" : "Resmî listeyi gör"}
                          </Bag>
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Sayfa>
    </>
  );
}
