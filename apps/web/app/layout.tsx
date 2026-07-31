import type { Metadata } from "next";
import { ayarGetir } from "@ykh/database";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { KayitSatiriAlani } from "@/components/kayit-satiri.tsx";
import { baglam } from "@/lib/oturum.ts";
import { paletGecerli } from "@/lib/palet.ts";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YKH-KDP · Karar Destek Platformu",
  description:
    "Yerel Kalkınma Hamlesi yatırım konusu hazırlama — kanıta bağlı, gerekçeli karar destek platformu.",
};

/**
 * Palet sunucuda okunur ve `data-palet` olarak basılır.
 *
 * İstemcide okunsaydı ilk boyama varsayılan paletle olur, sonra sıçrardı.
 * Ayar kurumsal olduğu için kullanıcıya göre değişmiyor; sunucu render'ı
 * doğru değeri baştan biliyor.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const palet = paletGecerli(await ayarGetir(await baglam(), "palet"));

  return (
    <html
      lang="tr"
      data-palet={palet}
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <KayitSatiriAlani />
      </body>
    </html>
  );
}
