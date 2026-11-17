import { ogKart, OG_BOYUT } from "@/lib/og-kart.tsx";

export const alt = "Giriş · YKH-KDP";
export const size = OG_BOYUT;
export const contentType = "image/png";

export default function Image() {
  return ogKart({ etiket: "Giriş", baslik: "Önerilerinize ve değerlendirmelerine dönün.", alt: "Yapay zekâ puanının hangi belgeye, hangi alıntıya dayandığını görün." });
}
