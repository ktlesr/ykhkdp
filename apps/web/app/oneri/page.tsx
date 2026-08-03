import type { Metadata } from "next";
import { bolgeler } from "@ykh/database";
import { grupAgirligi, TR33_2027_V1 } from "@ykh/scoring";
import { OneriSihirbazi } from "@/components/oneri-sihirbazi.tsx";
import { Baslik, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/**
 * Öneri sihirbazı — ürünün ana ekranı.
 *
 * kimlik → ajans bölgesi → il → öneri. Dört adım ama tek ekran ve tek route;
 * ürün beş ekran, altıncısı eklenmedi.
 */
export const metadata: Metadata = {
  title: "Öneri sihirbazı",
  description: "İlinize hangi yatırım konusunun önerilmesi gerektiğini dört adımda anlatın. Kayıt zorunlu değil; verdiğiniz öneri size ve kalkınma ajansına görünür, başka kimseye görünmez.",
  alternates: { canonical: "/oneri" },
  openGraph: { title: "Öneri sihirbazı", description: "İlinize hangi yatırım konusunun önerilmesi gerektiğini dört adımda anlatın. Kayıt zorunlu değil; verdiğiniz öneri size ve kalkınma ajansına görünür, başka kimseye görünmez.", url: "/oneri" },
  // `card` burada TEKRAR yazılıyor: Next sayfa seviyesindeki `twitter`
  // nesnesini üsttekiyle birleştirmiyor, tamamen eziyor. Ölçüldü — kart
  // `summary_large_image` yerine `summary` çıkıyordu, yani görsel küçük
  // küçük bir kutuda görünüyordu.
  twitter: { card: "summary_large_image", title: "Öneri sihirbazı", description: "İlinize hangi yatırım konusunun önerilmesi gerektiğini dört adımda anlatın. Kayıt zorunlu değil; verdiğiniz öneri size ve kalkınma ajansına görünür, başka kimseye görünmez." },
};

export default async function OneriVer({ searchParams }: { searchParams: Promise<{ il?: string }> }) {
  const { il } = await searchParams;
  const b = await baglam();
  const k = await kullanici();

  const bolgeListesi = await bolgeler(b);
  /**
   * URL'den gelen il yalnızca AÇIK DÖNEMİ varsa başlangıç seçimi olur.
   * Dönemi olmayan il de listede duruyor (yatırımcı ilini bulabilsin) ama
   * doğrudan öneri adımına atlarsa gönderim anında duvara çarpardı.
   */
  const gecerliIl = bolgeListesi.some((x) => x.iller.some((i) => i.kod === il && i.yil)) ? il : undefined;
  const yerellik = Math.round(grupAgirligi(TR33_2027_V1.agirliklar, "yerellik") * 100);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "Öneri ver", yol: "/oneri", aktif: true },
          ...(k ? [{ ad: "Önerilerim", yol: "/onerilerim" }] : []),
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

        <OneriSihirbazi
          bolgeler={bolgeListesi}
          girisliMi={Boolean(k)}
          misafirMi={Boolean(k?.misafir)}
          yerellikPayi={yerellik}
          baslangicIl={gecerliIl}
        />
      </Sayfa>
    </>
  );
}
