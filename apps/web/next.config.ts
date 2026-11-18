import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Kök dizindeki tek `.env` dosyasını yükle.
 *
 * Next yalnızca kendi proje kökünden (apps/web) .env okur, monorepo kökünden
 * okumaz. `node --env-file` ile başlatmak da olmuyor: Next alt süreçlerine
 * execArgv'i NODE_OPTIONS olarak geçiriyor ve `--env-file` orada yasak.
 * `process.loadEnvFile` stdlib'de ve next.config her süreçte yüklendiği için
 * anahtar hem sunucu bileşenlerine hem sunucu eylemlerine ulaşıyor.
 */
const kokEnv = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env");
if (existsSync(kokEnv)) process.loadEnvFile(kokEnv);

const nextConfig: NextConfig = {
  /**
   * Üretim imajı için tek başına çalışabilir çıktı: `node server.js`.
   * `node_modules` kopyalanmıyor, yalnızca izlenen dosyalar geliyor —
   * pnpm monorepo'da imaj ~1 GB yerine ~200 MB oluyor.
   *
   * `outputFileTracingRoot` şart: kök burada verilmezse Next izlemeyi
   * `apps/web`'den başlatıyor ve workspace paketlerini dışarıda bırakıyor.
   */
  output: "standalone",
  outputFileTracingRoot: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."),
  // Workspace paketleri kaynak TypeScript olarak yayınlanıyor; ayrı derleme adımı yok.
  transpilePackages: [
    "@ykh/ai-gateway",
    "@ykh/database",
    "@ykh/degerlendirme",
    "@ykh/domain",
    "@ykh/evidence-validation",
    "@ykh/observability",
    "@ykh/retrieval",
    "@ykh/scoring",
  ],
  // exceljs de dışarıda: dönüştürme işçisi onu paketlenmiş koddan değil node_modules'tan yükler.
  serverExternalPackages: ["postgres", "mammoth", "unpdf", "exceljs"],
  // Dönüştürme işçisi kaynak dosya olarak çalışır (iş parçacığı); paketleyici onu görmez.
  outputFileTracingIncludes: {
    "/belgeler/yukle": ["./lib/belge-cevir.ts", "./lib/belge-cevir-isci.mts"],
    "/belgeler": ["./lib/belge-cevir.ts", "./lib/belge-cevir-isci.mts"],
  },
};

export default nextConfig;
