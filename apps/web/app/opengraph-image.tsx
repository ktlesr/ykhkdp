import { ogKart, OG_BOYUT } from "@/lib/og-kart.tsx";

/**
 * Kök paylaşım kartı. Kapalı ekranlar (öneri, il, onay…) kendi kartını
 * üretmez, bunu miras alır: kartta öneri verisi olamaz.
 * `twitter-image` yok: X `twitter:image` yokken `og:image`'ı kullanır;
 * iki ayrı görsel zamanla ayrışırdı.
 */
export const alt = "YKH-KDP · Yerel Kalkınma Hamlesi karar destek platformu";
export const size = OG_BOYUT;
export const contentType = "image/png";

export default function Image() {
  return ogKart({
    etiket: "Yerel Kalkınma Hamlesi",
    baslik: "Dört yatırım konusu, gerekçesi gösterilebilir olsun.",
    alt: "Öneriler plan belgelerine birebir alıntıyla bağlanır, sekiz kriterle puanlanır ve ajans onayından geçer.",
  });
}
