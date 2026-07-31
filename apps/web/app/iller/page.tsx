import { illeriListele } from "@ykh/database";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { onaylayabilir } from "@ykh/domain";

/** İl listesi — platformun çalışma ekranı. Kodda hiçbir il sabitlenmez. */
export default async function Iller() {
  const k = await kullanici();
  const iller = await illeriListele(await baglam());

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

        {iller.length === 0 ? (
          <Bos baslik="Henüz açık dönem yok.">Ajans bir dönem açtığında öneriler burada listelenir.</Bos>
        ) : (
          <div className="border border-t-0 border-hairline bg-surface">
            {iller.map((x) => (
              <div
                key={x.il_kod}
                className="flex flex-wrap items-center gap-4 border-b border-b-[#E9E5DB] px-5 py-4 last:border-b-0"
              >
                <div className="min-w-[200px]">
                  <div className="text-[15px] font-medium">
                    {x.il}
                    {x.yil && <span className="num text-ink-mute"> · {x.yil}</span>}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    {x.ajans}
                    {x.kisa_ad && <span> · {x.kisa_ad}</span>}
                  </div>
                </div>

                {/* Dönemi olmayan il GİZLENMEZ: resmî listesi var ve görülebilir. */}
                <div className="flex flex-wrap items-center gap-2.5">
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
                    <Rozet tur="gri" isaret="—">
                      Açık dönem yok
                    </Rozet>
                  )}
                  {x.resmi_konu > 0 && (
                    <Rozet tur="notr">{x.resmi_konu} resmî yatırım konusu</Rozet>
                  )}
                </div>

                <div className="ml-auto flex gap-2.5">
                  {x.yil && <Bag href={`/oneri?il=${x.il_kod}`}>Öneri ver</Bag>}
                  <Bag varyant={x.yil ? "dolu" : "cizgi"} href={`/il/${x.il_kod}`}>
                    {x.yil ? "Sıralamayı gör" : "Resmî listeyi gör"}
                  </Bag>
                </div>
              </div>
            ))}
          </div>
        )}
      </Sayfa>
    </>
  );
}
