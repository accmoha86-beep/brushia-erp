# ─── Brushia ERP API — Multi-stage Dockerfile ───

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN npm install -g pnpm@9.15.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS build
RUN npm install -g pnpm@9.15.0
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @brushia/shared build && \
    pnpm --filter @brushia/config build && \
    pnpm --filter @brushia/db build && \
    pnpm --filter @brushia/api build

# Stage 3: Production
FROM node:20-alpine AS production
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S brushia && \
    adduser -S -u 1001 -G brushia brushia
WORKDIR /app
COPY --from=build --chown=brushia:brushia /app/apps/api/dist ./dist
COPY --from=build --chown=brushia:brushia /app/apps/api/node_modules ./node_modules
COPY --from=build --chown=brushia:brushia /app/apps/api/package.json ./
USER brushia
ENV NODE_ENV=production
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["node", "dist/main.js"]
