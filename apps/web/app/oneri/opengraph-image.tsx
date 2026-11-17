import { ogKart, OG_BOYUT } from "@/lib/og-kart.tsx";

export const alt = "Öneri sihirbazı · YKH-KDP";
export const size = OG_BOYUT;
export const contentType = "image/png";

export default function Image() {
  return ogKart({ etiket: "Öneri sihirbazı", baslik: "İlinize hangi yatırım konusu, neden?", alt: "Dört adımda anlatın. Kayıt zorunlu değil; öneriniz yalnızca size ve kalkınma ajansına görünür." });
}
