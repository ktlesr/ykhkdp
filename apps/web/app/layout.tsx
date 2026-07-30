import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { KayitSatiriAlani } from "@/components/kayit-satiri.tsx";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <KayitSatiriAlani />
      </body>
    </html>
  );
}
