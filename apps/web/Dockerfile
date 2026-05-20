# ─── Brushia ERP Web — Multi-stage Dockerfile ───

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @brushia/shared build && \
    pnpm --filter @brushia/web build

# Stage 3: Production
FROM node:20-alpine AS production
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S brushia && \
    adduser -S brushia -u 1001
WORKDIR /app
COPY --from=build --chown=brushia:brushia /app/apps/web/.next/standalone ./
COPY --from=build --chown=brushia:brushia /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=brushia:brushia /app/apps/web/public ./apps/web/public
USER brushia
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
