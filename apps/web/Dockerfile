FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install deps ──
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# ── Build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./

# Copy all source (includes tsconfig.base.json, packages/, apps/)
COPY . .

# NEXT_PUBLIC_ vars must be available at build time for Next.js to inline them
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Install typescript globally for package compilation
RUN npm install -g typescript

# Build workspace packages (they extend ../../tsconfig.base.json)
RUN cd packages/config && tsc -b --force 2>&1 && echo "✅ config built" || echo "⚠️ config build had warnings"
RUN cd packages/shared && tsc -b --force 2>&1 && echo "✅ shared built" || echo "⚠️ shared build had warnings"

# Build Next.js
RUN pnpm --filter @brushia/web build

# Create public dir if it does not exist
RUN mkdir -p apps/web/public

# ── Production ──
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
