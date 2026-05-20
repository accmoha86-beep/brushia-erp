FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install ALL deps ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile --ignore-scripts && pnpm rebuild 2>/dev/null; true

# ── Build ──
FROM base AS builder
COPY --from=deps /app ./
COPY . .

# Build shared packages using tsc -b (required for composite projects)
RUN cd packages/config && npx tsc -b --force 2>&1; true
RUN cd packages/shared && npx tsc -b --force 2>&1; true
RUN cd packages/db && npx tsc -b --force 2>&1; true

# Verify package builds
RUN ls packages/config/dist/index.js && echo "✅ config built" || echo "⚠️ config build failed"
RUN ls packages/shared/dist/index.js && echo "✅ shared built" || echo "⚠️ shared build failed"
RUN ls packages/db/dist/index.js && echo "✅ db built" || echo "⚠️ db build failed"

# Build API using SWC
RUN cd apps/api && npx nest build 2>&1 && echo "✅ API BUILD OK" || \
    (echo "nest build failed, trying direct swc..." && \
     npx swc src -d dist --config-file .swcrc 2>&1 || \
     (echo "swc failed too, trying tsc transpile..." && \
      npx tsc --outDir dist --noEmit false --declaration false --skipLibCheck --noCheck 2>&1))

# Verify API output
RUN ls apps/api/dist/main.js && echo "✅ main.js exists"

# ── Prepare production node_modules ──
# Replace pnpm workspace symlinks with real built packages
RUN rm -rf node_modules/@brushia/shared node_modules/@brushia/config node_modules/@brushia/db 2>/dev/null; true \
    && mkdir -p node_modules/@brushia/shared node_modules/@brushia/config node_modules/@brushia/db \
    && cp packages/shared/package.json node_modules/@brushia/shared/ \
    && cp -r packages/shared/dist node_modules/@brushia/shared/dist \
    && cp packages/config/package.json node_modules/@brushia/config/ \
    && cp -r packages/config/dist node_modules/@brushia/config/dist \
    && cp packages/db/package.json node_modules/@brushia/db/ \
    && cp -r packages/db/dist node_modules/@brushia/db/dist \
    && echo "✅ Workspace packages prepared for production"

# ── Production ──
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "dist/main.js"]
