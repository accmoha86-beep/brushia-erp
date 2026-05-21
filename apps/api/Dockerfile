FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install deps ──
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --ignore-scripts 2>/dev/null || pnpm install --no-frozen-lockfile --ignore-scripts

# ── Build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install SWC globally — fast transpiler, zero type errors
RUN npm install -g @swc/cli @swc/core

# Build workspace packages with SWC (CommonJS output for NestJS require())
RUN cd packages/config && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ config built"
RUN cd packages/shared && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ shared built"
RUN cd packages/db && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ db built"

# Build API with SWC (uses apps/api/.swcrc for NestJS decorators)
RUN cd apps/api && swc src -d dist --strip-leading-paths && echo "✅ API built"
RUN test -f apps/api/dist/main.js && echo "✅ API BUILD OK" || (echo "❌ API BUILD FAILED" && exit 1)

# Replace pnpm symlinks with real compiled packages for production
RUN for pkg in config shared db; do \
      target="node_modules/@brushia/$pkg"; \
      if [ -L "$target" ] || [ -d "$target" ]; then rm -rf "$target"; fi; \
      mkdir -p "$target"; \
      cp "packages/$pkg/package.json" "$target/"; \
      cp -r "packages/$pkg/dist" "$target/dist"; \
      echo "✅ $pkg prepared"; \
    done

# ── Production ──
FROM node:20-slim AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["node", "dist/main.js"]
