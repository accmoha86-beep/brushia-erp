FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install deps ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm rebuild 2>/dev/null || true

# ── Build ──
FROM base AS builder
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @brushia/config build 2>/dev/null || true
RUN pnpm --filter @brushia/shared build 2>/dev/null || true
RUN pnpm --filter @brushia/db build 2>/dev/null || true
RUN pnpm --filter @brushia/api build

# ── Production ──
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@brushia/shared/dist
COPY --from=builder /app/packages/config/dist ./node_modules/@brushia/config/dist
COPY --from=builder /app/packages/db/dist ./node_modules/@brushia/db/dist
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "dist/main.js"]
