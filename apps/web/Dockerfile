# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps
RUN npm install -g pnpm@9.15.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile

# ── Stage 2: Build ──
FROM node:20-slim AS builder
RUN npm install -g pnpm@9.15.0
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @brushia/shared build || true
RUN pnpm --filter @brushia/web build

# ── Stage 3: Production ──
FROM node:20-slim AS production
RUN groupadd -g 1001 brushia && useradd -u 1001 -g brushia -m brushia
WORKDIR /app
COPY --from=builder --chown=brushia:brushia /app/apps/web/.next/standalone ./
COPY --from=builder --chown=brushia:brushia /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=brushia:brushia /app/apps/web/public ./apps/web/public
USER brushia
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
