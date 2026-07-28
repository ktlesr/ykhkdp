import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace paketleri kaynak TypeScript olarak yayınlanıyor; ayrı derleme adımı yok.
  transpilePackages: [
    "@ykh/ai-gateway",
    "@ykh/database",
    "@ykh/domain",
    "@ykh/evidence-validation",
    "@ykh/observability",
    "@ykh/reporting",
    "@ykh/retrieval",
    "@ykh/scoring",
  ],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
