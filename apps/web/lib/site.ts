/**
 * Site kimliği — paylaşım kartları, kanonik adres ve sitemap için tek kaynak.
 *
 * `metadataBase` mutlak bir adres istiyor: Open Graph görselinin ve kanonik
 * bağlantının tam URL'si olmadan WhatsApp, LinkedIn ve X kartı çizemiyor.
 * Sunucu isteğin host'unu metadata üretirken bilmiyor, o yüzden dışarıdan
 * verilmek zorunda.
 */

const VARSAYILAN = "http://localhost:3000";

/**
 * Üretimde `YKH_SITE_URL` verilmezse paylaşım kartları localhost'a bakar ve
 * hiçbir yerde görünmez. Sessiz kalmıyoruz: değer yoksa bir kez uyarı
 * düşüyor. Hata fırlatmıyoruz çünkü site bunsuz da çalışır — yalnızca
 * paylaşımlar bozulur, ve çalışan bir siteyi paylaşım yüzünden düşürmek
 * orantısız olur.
 */
let uyarildi = false;

export function siteUrl(): URL {
  const ham = process.env.YKH_SITE_URL?.trim();
  if (!ham) {
    if (!uyarildi && process.env.NODE_ENV === "production") {
      uyarildi = true;
      console.warn(
        JSON.stringify({
          seviye: "uyari",
          mesaj: "site_adresi_yok",
          not: "YKH_SITE_URL tanımlı değil; paylaşım kartları ve sitemap localhost'a bakacak.",
        }),
      );
    }
    return new URL(VARSAYILAN);
  }
  try {
    return new URL(ham);
  } catch {
    console.warn(
      JSON.stringify({ seviye: "uyari", mesaj: "site_adresi_gecersiz", deger: ham }),
    );
    return new URL(VARSAYILAN);
  }
}

/**
 * DİZİNE GİRECEK yollar. Liste beyaz listedir, kara liste değil — yeni bir
 * ekran eklendiğinde varsayılan davranış "indekslenmesin" olsun diye.
 *
 * Buraya giren her yol arama motoruna ve paylaşım kartına açıktır. Öneri
 * taşıyan hiçbir ekran buraya giremez: `/iller`, `/il/[il]`, `/oneri/[id]`,
 * `/onerilerim`, `/onay`, `/belgeler`, `/ayarlar`, `/rapor` dışarıda.
 */
export const ACIK_YOLLAR = [
  { yol: "/", oncelik: 1, siklik: "weekly" as const },
  { yol: "/oneri", oncelik: 0.8, siklik: "monthly" as const },
  { yol: "/giris", oncelik: 0.3, siklik: "yearly" as const },
  { yol: "/kayit", oncelik: 0.3, siklik: "yearly" as const },
];

/**
 * Kapalı ekranların metadata'sı. Tek yerden geliyor ki bir ekranda unutulmasın.
 *
 * `nofollow` da var: bir öneri sayfasının bağlantıları başka öneri sayfalarına
 * gidiyor ve tarayıcı robotunun oradan yürümesini istemiyoruz. `nocache`
 * arama motorunun kopyayı saklamasını engelliyor — yetki kalkınca içerik de
 * gitsin.
 */
export const KAPALI = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
} as const;
