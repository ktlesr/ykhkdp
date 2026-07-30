import { redirect } from "next/navigation";
import { belgeleriListele, illeriListele } from "@ykh/database";
import { onaylayabilir } from "@ykh/domain";
import { BelgeFormu } from "@/components/belge-formu.tsx";
import { Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

const TUR_ETIKET: Record<string, string> = {
  bolge_plani: "Bölge planı",
  kalkinma_plani: "Kalkınma planı",
  ovp: "Orta vadeli program",
  strateji: "Strateji belgesi",
  il_raporu: "İl raporu",
  diger: "Diğer",
};

/** Üst ölçekli belgeler — AI değerlendirmesinin dayanağı. */
export default async function Belgeler() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fbelgeler");
  if (!onaylayabilir(k.rol)) redirect("/");

  const b = await baglam();
  const [belgeler, iller] = await Promise.all([belgeleriListele(b), illeriListele(b)]);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/" },
          { ad: "Onay", yol: "/onay" },
          { ad: "Belgeler", yol: "/belgeler", aktif: true },
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket="Ajans"
          alt="Yapay zekâ puanlarını yalnızca bu belgelere dayandırır ve alıntıları birebir doğrulanır. Belgeye bağlanamayan öneri, puanı yüksek olsa da slot dolduramaz."
        >
          Üst ölçekli belgeler
        </Baslik>

        <BelgeFormu iller={iller.map((x) => ({ kod: x.il_kod, ad: x.il }))} />

        <div className="mt-6 border border-hairline bg-surface">
          <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
            Yüklü belgeler ({belgeler.length})
          </div>
          {belgeler.length === 0 ? (
            <Bos baslik="Henüz belge yok.">
              Belge yüklenmeden yapay zekâ hiçbir öneriyi gerekçelendiremez; tüm dayanak puanları 0 kalır ve slotlar
              boş görünür.
            </Bos>
          ) : (
            belgeler.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center gap-3 border-b border-b-[#E9E5DB] px-4 py-3.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{x.ad}</div>
                  <div className="mt-1 flex flex-wrap gap-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    <span>{TUR_ETIKET[x.tur] ?? x.tur}</span>
                    {x.yil && <span className="num">{x.yil}</span>}
                    <span className="num">{x.uzunluk.toLocaleString("tr-TR")} karakter</span>
                  </div>
                </div>
                <Rozet tur="notr">
                  {x.il_kod ? `İl · ${x.il_kod}` : x.ajans_kod ? `Ajans · ${x.ajans_kod}` : "Ulusal"}
                </Rozet>
              </div>
            ))
          )}
        </div>
      </Sayfa>
    </>
  );
}
