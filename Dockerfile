# ── YKH-KDP · web (Next.js) ───────────────────────────────────────────────────
#
# Üç aşama: bağımlılıklar → derleme → çalıştırma. Çalışan imajda pnpm, kaynak
# kod ve derleme araçları YOK; yalnızca Next'in standalone çıktısı var.
#
# `docs/` ve `packages/database/data/` imaja giriyor: NACE, ajans listesi,
# resmî tebliğ listeleri ve üst ölçekli plan belgeleri kurulum adımında
# okunuyor. Bu dosyalar KODDA SABİTLENMİŞ değil, veri dosyası — ürünün kuralı
# bu (brief §7) ve imajın da onlara ulaşması gerekiyor.

FROM node:22-alpine AS temel
RUN corepack enable
WORKDIR /uygulama

# ── bağımlılıklar ─────────────────────────────────────────────────────────────
FROM temel AS bagimlilik
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/ai-gateway/package.json packages/ai-gateway/
COPY packages/database/package.json packages/database/
COPY packages/degerlendirme/package.json packages/degerlendirme/
COPY packages/domain/package.json packages/domain/
COPY packages/evidence-validation/package.json packages/evidence-validation/
COPY packages/observability/package.json packages/observability/
COPY packages/retrieval/package.json packages/retrieval/
COPY packages/scoring/package.json packages/scoring/
RUN pnpm install --frozen-lockfile

# ── derleme ───────────────────────────────────────────────────────────────────
FROM temel AS derleme
# TÜM ağaç kopyalanıyor, yalnızca kök `node_modules` değil: pnpm her workspace
# paketine kendi `node_modules`'ını kuruyor ve içindeki bağlantılar oradan
# çözülüyor. Yalnızca kökü kopyalayınca `@ykh/scoring` bulunamadı ve derleme
# "module not found" ile düştü. Bağlantılar göreli, kopyalamayı atlatıyorlar.
COPY --from=bagimlilik /uygulama ./
# Kaynak üste biniyor; `node_modules` .dockerignore'da olduğu için silinmiyor.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @ykh/web build

# ── çalıştırma ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS calisma
WORKDIR /uygulama
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Kök olmayan kullanıcı: bir uzaktan kod çalıştırma açığı root'a değil,
# yazma izni olmayan bir kullanıcıya düşsün.
RUN addgroup -g 1001 ykh && adduser -u 1001 -G ykh -S ykh

COPY --from=derleme --chown=ykh:ykh /uygulama/apps/web/.next/standalone ./
COPY --from=derleme --chown=ykh:ykh /uygulama/apps/web/.next/static ./apps/web/.next/static
# `public/` yok — statik varlık kullanılmıyor. Eklenirse bu satır geri gelir:
# COPY --from=derleme --chown=ykh:ykh /uygulama/apps/web/public ./apps/web/public

USER ykh
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
