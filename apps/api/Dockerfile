FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install ALL deps ──
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --ignore-scripts 2>/dev/null || pnpm install --no-frozen-lockfile --ignore-scripts

# ── Copy source & build ──
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install SWC globally
RUN npm install -g @swc/cli @swc/core

# Build workspace packages with SWC (CommonJS for NestJS)
RUN cd packages/config && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ config built"
RUN cd packages/shared && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ shared built"
RUN cd packages/db && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ db built"

# Build API with SWC
RUN cd apps/api && swc src -d dist --strip-leading-paths && echo "✅ API built"
RUN test -f apps/api/dist/main.js && echo "✅ API BUILD OK" || (echo "❌ API BUILD FAILED" && exit 1)

# Copy migrations
RUN mkdir -p /app/migrations && cp -r packages/db/migrations/* /app/migrations/ 2>/dev/null || true

# ── Run ──
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
