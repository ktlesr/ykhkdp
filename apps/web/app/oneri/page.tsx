import Link from "next/link";
import { illeriListele, ilceler } from "@ykh/database";
import { grupAgirligi, TR33_2027_V1 } from "@ykh/scoring";
import { OneriFormu } from "@/components/oneri-formu.tsx";
import { Bag, Baslik, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/**
 * Öneri formu — ürünün ana ekranı.
 *
 * Beş alan: başlık · neden burada · il · ilçe · NACE (boş bırakılabilir).
 * Kanıt kartı, dosya güçlendirme, benzerlik katmanı yok. Gönder, biter.
 */
export default async function OneriVer({ searchParams }: { searchParams: Promise<{ il?: string }> }) {
  const { il } = await searchParams;
  const b = await baglam();
  const k = await kullanici();

  const iller = await illeriListele(b);
  const secili = il && iller.some((x) => x.il_kod === il) ? il : (iller[0]?.il_kod ?? "");
  const ilceListesi = secili ? (await ilceler(b, secili)).map((x) => x.ad) : [];
  const yerellik = Math.round(grupAgirligi(TR33_2027_V1.agirliklar, "yerellik") * 100);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "Öneri ver", yol: "/oneri", aktif: true },
          { ad: "İller", yol: "/" },
        ]}
      />
      <Sayfa>
        <Baslik
          ustEtiket="Yatırım konusu önerisi"
          alt={
            <>
              Yatırım konusunu ve <b>neden bu ilde/ilçede</b> yapılması gerektiğini yazın. Yapay zekâ öneriyi üst
              ölçekli belgelere ve sekiz kritere göre puanlar; ajans onayladıktan sonra il sıralamasında görünür.
            </>
          }
        >
          Bir yatırım konusu öner
        </Baslik>

        {!k ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 border border-hairline bg-paper px-4 py-3.5">
            <span className="text-[13.5px] text-ink-soft">
              Öneri göndermek için hesap gerekiyor. Kurum kaydı istenmez, e-posta yeterli.
            </span>
            <div className="ml-auto flex gap-2.5">
              <Bag varyant="dolu" href="/giris?hedef=%2Foneri">
                Giriş yap
              </Bag>
              <Bag href="/kayit">Kayıt ol</Bag>
            </div>
          </div>
        ) : iller.length === 0 ? (
          <div className="tex-absent mt-5 border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-4">
            <div className="text-[14.5px] font-medium text-ink">Henüz açık dönem yok.</div>
            <p className="mt-1.5 text-[13px] text-ink-soft">Ajans bir dönem açtığında öneri kabulü başlar.</p>
          </div>
        ) : (
          <OneriFormu
            iller={iller.map((x) => ({ kod: x.il_kod, ad: x.il }))}
            secili={secili}
            ilceler={ilceListesi}
            yerellikPayi={yerellik}
          />
        )}

        <p className="mt-6 text-[12.5px] leading-[1.5] text-ink-mute">
          Öneriniz gönderildikten sonra <Link href="/oneri" className="border-b border-b-navy/35">kendi sayfasında</Link>{" "}
          puanı, gerekçesi ve hangi belgelere dayandığını görebilirsiniz.
        </p>
      </Sayfa>
    </>
  );
}
