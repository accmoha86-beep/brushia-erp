# ============================================================
# Brushia ERP API — Production Dockerfile
# ============================================================
FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0

# ── Install dependencies ──
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --ignore-scripts 2>/dev/null || pnpm install --no-frozen-lockfile --ignore-scripts

# ── Build workspace packages ──
FROM deps AS builder
WORKDIR /app
COPY packages/ packages/
COPY apps/api/ apps/api/

# Build packages with composite project references
RUN cd packages/config && npx tsc -b --force && echo "✅ config built"
RUN cd packages/shared && npx tsc -b --force && echo "✅ shared built"
RUN cd packages/db && npx tsc -b --force && echo "✅ db built"

# Build API with SWC
RUN cd apps/api && npx swc src -d dist --strip-leading-paths && echo "✅ API built"
RUN test -f apps/api/dist/main.js && echo "✅ API BUILD OK" || (echo "❌ API BUILD FAILED" && exit 1)

# Prepare workspace packages for production (replace pnpm symlinks with real files)
RUN for pkg in config shared db; do \
      target="node_modules/@brushia/$pkg"; \
      if [ -L "$target" ] || [ -d "$target" ]; then rm -rf "$target"; fi; \
      mkdir -p "$target"; \
      cp "packages/$pkg/package.json" "$target/"; \
      if [ -d "packages/$pkg/dist" ]; then cp -r "packages/$pkg/dist" "$target/dist"; fi; \
      if [ -d "packages/$pkg/src" ]; then cp -r "packages/$pkg/src" "$target/src"; fi; \
      echo "✅ $pkg prepared"; \
    done

# ── Production image ──
FROM node:20-slim AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations

EXPOSE 3001
CMD ["node", "dist/main.js"]
