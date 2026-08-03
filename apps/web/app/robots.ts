import type { MetadataRoute } from "next";
import { ACIK_YOLLAR, siteUrl } from "@/lib/site.ts";

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
        allow: ACIK_YOLLAR.map((x) => (x.yol === "/" ? "/$" : x.yol)),
      },
    ],
    sitemap: new URL("/sitemap.xml", site).toString(),
    host: site.origin,
  };
}
