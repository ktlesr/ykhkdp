import { illeriListele } from "@ykh/database";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { onaylayabilir } from "@ykh/domain";

/** İl listesi — girişteki ekran. Kodda hiçbir il sabitlenmez. */
export default async function Anasayfa() {
  const k = await kullanici();
  const iller = await illeriListele(await baglam());

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/", aktif: true },
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
          alt="Her il için dört yatırım konusu. Öneriler yapay zekâ tarafından üst ölçekli belgelere ve sekiz kritere göre puanlanır, ajans onayından sonra listeye girer. Sıralama karar değildir."
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
                    {x.il} · {x.yil}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">{x.ajans}</div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Rozet tur={x.listede > 0 ? "yesil" : "gri"} isaret={x.listede > 0 ? "■" : "—"}>
                    {x.listede} listede
                  </Rozet>
                  {x.bekleyen > 0 && (
                    <Rozet tur="amber" isaret="◌">
                      {x.bekleyen} onay bekliyor
                    </Rozet>
                  )}
                </div>

                <div className="ml-auto flex gap-2.5">
                  <Bag href={`/oneri?il=${x.il_kod}`}>Öneri ver</Bag>
                  <Bag varyant="dolu" href={`/il/${x.il_kod}`}>
                    Sıralamayı gör
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
