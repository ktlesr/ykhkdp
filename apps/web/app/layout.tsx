import type { Metadata } from "next";
import { ayarGetir } from "@ykh/database";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { KayitSatiriAlani } from "@/components/kayit-satiri.tsx";
import { baglam } from "@/lib/oturum.ts";
import { paletGecerli } from "@/lib/palet.ts";
import { siteUrl } from "@/lib/site.ts";
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

const AD = "YKH-KDP";
const ACIKLAMA =
  "Yerel Kalkınma Hamlesi yatırım konusu hazırlama: öneriler üst ölçekli plan " +
  "belgelerine birebir alıntıyla bağlanır, sekiz kriterle puanlanır ve kalkınma " +
  "ajansı onayından geçer.";

/**
 * Paylaşım ve arama motoru künyesi.
 *
 * VARSAYILAN İNDEKSLEMEYE KAPALI DEĞİL ama ÖNERİ TAŞIYAN HİÇBİR EKRAN AÇIK
 * DEĞİL: `/iller`, `/il/[il]`, `/oneri/[id]`, `/onerilerim`, `/onay`,
 * `/belgeler`, `/ayarlar` kendi metadata'sında `KAPALI` işaretini taşıyor ve
 * `robots.ts` onları ayrıca yasaklıyor. Bir öneri başlığının paylaşım kartına
 * ya da arama sonucuna düşmesi, iki gün önce RLS ile kapattığımız şeyi geri
 * açardı.
 *
 * `metadataBase` olmadan Next göreli görsel yollarını mutlak adrese
 * çeviremiyor ve WhatsApp/LinkedIn/X kart çizemiyor.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${AD} · Yerel Kalkınma Hamlesi karar destek platformu`,
    // Alt sayfalar yalnızca kendi adını yazar, künye burada tamamlanır.
    template: `%s · ${AD}`,
  },
  description: ACIKLAMA,
  applicationName: AD,
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  keywords: [
    "Yerel Kalkınma Hamlesi",
    "yatırım konusu",
    "kalkınma ajansı",
    "bölgesel kalkınma",
    "karar destek",
    "NACE",
    "yatırım teşvik",
  ],
  authors: [{ name: AD }],
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: AD,
    title: `${AD} · Yerel Kalkınma Hamlesi karar destek platformu`,
    description: ACIKLAMA,
    url: "/",
  },
  twitter: {
    // WhatsApp, LinkedIn ve Facebook Open Graph okuyor; X kendi etiketlerini
    // istiyor. `summary_large_image` 1200×630 kartı tam genişlikte gösteriyor.
    card: "summary_large_image",
    title: `${AD} · Yerel Kalkınma Hamlesi karar destek platformu`,
    description: ACIKLAMA,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
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
