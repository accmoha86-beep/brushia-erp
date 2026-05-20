FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install deps ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm rebuild 2>/dev/null || true

# ── Build ──
FROM base AS builder
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @brushia/shared build 2>/dev/null || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @brushia/web build

# ── Production ──
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
