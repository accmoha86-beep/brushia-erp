# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps
RUN npm install -g pnpm@9.15.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile

# ── Stage 2: Build ──
FROM node:20-slim AS builder
RUN npm install -g pnpm@9.15.0
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @brushia/shared build || true
RUN pnpm --filter @brushia/db build || true
RUN pnpm --filter @brushia/api build

# ── Stage 3: Production ──
FROM node:20-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 brushia && useradd -u 1001 -g brushia -m brushia
WORKDIR /app
COPY --from=builder --chown=brushia:brushia /app/apps/api/dist ./dist
COPY --from=builder --chown=brushia:brushia /app/node_modules ./node_modules
COPY --from=builder --chown=brushia:brushia /app/apps/api/package.json ./
USER brushia
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
