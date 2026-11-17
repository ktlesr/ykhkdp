import type { MetadataRoute } from "next";
import { ACIK_YOLLAR, siteUrl } from "@/lib/site.ts";

/** Derleme anında değil istekte üretilir: `YKH_SITE_URL` yalnızca çalışma ortamında var;
 *  statik üretimde adres localhost kalıyordu (canlıda ölçüldü). */
export const dynamic = "force-dynamic";

/**
 * sitemap.xml — yalnızca herkese açık yollar.
 *
 * İl sayfaları, öneri kayıtları ve rapor ekranları BİLEREK YOK. Bir sitemap
 * "burada şu adresler var" diye ilan eder; gizli bir kaydın adresini ilan
 * etmek, içeriğini vermese de varlığını ve sayısını sızdırır.
 *
 * Yollar `ACIK_YOLLAR` beyaz listesinden geliyor — `robots.ts` ile aynı
 * kaynak, ikisi ayrışamaz.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  // Dağıtım zamanı; her istekte `new Date()` çağırmak sitemap'i her seferinde
  // "az önce değişti" gösterirdi ve sinyali değersizleştirirdi.
  const guncellendi = new Date();

  return ACIK_YOLLAR.map((x) => ({
    url: new URL(x.yol, site).toString(),
    lastModified: guncellendi,
    changeFrequency: x.siklik,
    priority: x.oncelik,
  }));
}
