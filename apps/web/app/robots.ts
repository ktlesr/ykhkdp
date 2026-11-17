import type { MetadataRoute } from "next";
import { ACIK_YOLLAR, siteUrl } from "@/lib/site.ts";

/** Derleme anında değil istekte üretilir: `YKH_SITE_URL` yalnızca çalışma ortamında var;
 *  statik üretimde adres localhost kalıyordu (canlıda ölçüldü). */
export const dynamic = "force-dynamic";

/**
 * robots.txt — BEYAZ LİSTE.
 *
 * `disallow: "/"` ile başlayıp yalnızca açık yolları geri açıyoruz. Kara liste
 * yazsaydık yarın eklenen bir ekran varsayılan olarak AÇIK olurdu ve kimse
 * fark etmezdi. Bu üründe öneriler gizli; varsayılan "kapalı" olmalı.
 *
 * `robots.txt` bir rica, kapı değil — gerçek kapı RLS ve sayfa yönlendirmesi
 * (`lib/erisim.test.ts`). Bu dosya iyi niyetli tarayıcıların gizli ekranları
 * indekslemesini engelliyor, kötü niyetliyi değil.
 */
export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
        /**
         * `/` için `Allow: /$` — sondaki `$` ŞART.
         *
         * Ölçüldü: düz `Allow: /` beyaz listeyi tamamen geçersiz kılıyordu.
         * O kalıp "kökle başlayan her şey" demek, yani tüm site; `Disallow: /`
         * ile birlikte daha uzun eşleşme kazanıyor ve gizli ekranlar açılıyor.
         * `$` kalıbı adresin SONUNU bağlıyor, yalnızca ana sayfayı açıyor.
         * Google ve Bing bu kalıbı destekliyor.
         */
        // Paylaşım kartı ve simgeler: X'in tarayıcısı robots.txt'e uyar,
        // kart görseli yasaklıysa kart boş çıkar.
        allow: [
          ...ACIK_YOLLAR.map((x) => (x.yol === "/" ? "/$" : x.yol)),
          "/opengraph-image",
          "/icon",
          "/apple-icon",
          "/manifest.webmanifest",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", site).toString(),
    host: site.origin,
  };
}
