import type { Metadata } from "next";
import { bolgeler } from "@ykh/database";
import { grupAgirligi, TR33_2027_V1 } from "@ykh/scoring";
import { OneriSihirbazi } from "@/components/oneri-sihirbazi.tsx";
import { Baslik, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { acikSayfa } from "@/lib/site.ts";

/**
 * Öneri sihirbazı — ürünün ana ekranı.
 *
 * kimlik → ajans bölgesi → il → öneri. Dört adım ama tek ekran ve tek route;
 * ürün beş ekran, altıncısı eklenmedi.
 */
const ACIKLAMA =
  "İlinize hangi yatırım konusunun önerilmesi gerektiğini dört adımda anlatın. Kayıt zorunlu değil; " +
  "verdiğiniz öneri size ve kalkınma ajansına görünür, başka kimseye görünmez.";

/**
 * `?il=` ile paylaşılan bağlantı o ilin adını taşır ("Uşak için yatırım
 * konusu öner"). İl adı kamuya açık coğrafya; öneri verisi değil. Kanonik
 * adres yine `/oneri`: il başına ayrı sayfa dizine girmez.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ il?: string }> }): Promise<Metadata> {
  const { il } = await searchParams;
  const temel = acikSayfa({ baslik: "Öneri sihirbazı", aciklama: ACIKLAMA, yol: "/oneri" });
  if (!il) return temel;
  const ilAd = (await bolgeler(await baglam()).catch(() => []))
    .flatMap((b) => b.iller)
    .find((x) => x.kod === il)?.ad;
  if (!ilAd) return temel;
  const baslik = `${ilAd} için yatırım konusu öner`;
  const aciklama = `${ilAd} ilinde hangi yatırım konusunun neden yapılması gerektiğini anlatın. ${ACIKLAMA.split(". ").slice(1).join(". ")}`;
  return {
    ...temel,
    title: baslik,
    description: aciklama,
    openGraph: { ...temel.openGraph, title: baslik, description: aciklama },
    twitter: { ...temel.twitter, title: baslik, description: aciklama },
  };
}

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
