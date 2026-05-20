FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install deps ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile --ignore-scripts && pnpm rebuild 2>/dev/null; true

# ── Build ──
FROM base AS builder
COPY --from=deps /app ./
COPY . .

# Build shared packages (composite = tsc -b required)
RUN cd packages/config && npx tsc -b --force 2>&1; true
RUN cd packages/shared && npx tsc -b --force 2>&1; true

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @brushia/web build

# ── Production ──
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public 2>/dev/null || true
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
