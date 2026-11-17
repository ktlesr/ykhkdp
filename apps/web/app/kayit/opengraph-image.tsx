import { ogKart, OG_BOYUT } from "@/lib/og-kart.tsx";

export const alt = "Hesap aç · YKH-KDP";
export const size = OG_BOYUT;
export const contentType = "image/png";

export default function Image() {
  return ogKart({ etiket: "Hesap aç", baslik: "Önerilerinizi her cihazdan izleyin.", alt: "Kurum kaydı ve kurum onayı istenmez. Öneri vermek için hesap zorunlu değildir." });
}
