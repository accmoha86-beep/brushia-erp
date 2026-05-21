FROM node:20-slim AS base
RUN npm install -g pnpm@9.15.0
ENV HUSKY=0
WORKDIR /app

# ── Install deps ──
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --ignore-scripts 2>/dev/null || pnpm install --no-frozen-lockfile --ignore-scripts

# ── Build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install SWC globally
RUN npm install -g @swc/cli @swc/core

# Build workspace packages with SWC (CommonJS for NestJS)
RUN cd packages/config && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ config built"
RUN cd packages/shared && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ shared built"
RUN cd packages/db && swc src -d dist --strip-leading-paths -C module.type=commonjs && echo "✅ db built"

# Build API with SWC (uses .swcrc for NestJS decorators)
RUN cd apps/api && swc src -d dist --strip-leading-paths && echo "✅ API built"
RUN test -f apps/api/dist/main.js && echo "✅ API BUILD OK" || (echo "❌ API BUILD FAILED" && exit 1)

# Create production package.json WITHOUT workspace deps (npm can't resolve those)
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('/app/apps/api/package.json','utf8')); \
  const deps = {...pkg.dependencies}; \
  delete deps['@brushia/config']; \
  delete deps['@brushia/db']; \
  delete deps['@brushia/shared']; \
  pkg.dependencies = deps; \
  delete pkg.devDependencies; \
  require('fs').writeFileSync('/app/prod-package.json', JSON.stringify(pkg,null,2)); \
  console.log('✅ Production package.json created with', Object.keys(deps).length, 'deps'); \
"

# Prepare workspace packages as real directories
RUN mkdir -p /app/workspace-packages && \
    for pkg in config shared db; do \
      mkdir -p "/app/workspace-packages/@brushia/$pkg"; \
      cp "packages/$pkg/package.json" "/app/workspace-packages/@brushia/$pkg/"; \
      cp -r "packages/$pkg/dist" "/app/workspace-packages/@brushia/$pkg/dist"; \
      echo "✅ @brushia/$pkg packaged"; \
    done

# ── Production ──
FROM node:20-slim AS production
WORKDIR /app

# Copy production package.json and install with npm (flat node_modules, no symlinks)
COPY --from=builder /app/prod-package.json ./package.json
RUN npm install --production --legacy-peer-deps 2>&1 | tail -5

# Copy workspace packages into node_modules
COPY --from=builder /app/workspace-packages/ ./node_modules/

# Copy built API and migrations
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["node", "dist/main.js"]
