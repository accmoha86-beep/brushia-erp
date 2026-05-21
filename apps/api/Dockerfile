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

# Create production package.json — merge API deps + workspace package deps, remove workspace refs
RUN node -e " \
  const fs = require('fs'); \
  const api = JSON.parse(fs.readFileSync('/app/apps/api/package.json','utf8')); \
  const config = JSON.parse(fs.readFileSync('/app/packages/config/package.json','utf8')); \
  const shared = JSON.parse(fs.readFileSync('/app/packages/shared/package.json','utf8')); \
  const db = JSON.parse(fs.readFileSync('/app/packages/db/package.json','utf8')); \
  const deps = {...api.dependencies}; \
  delete deps['@brushia/config']; \
  delete deps['@brushia/db']; \
  delete deps['@brushia/shared']; \
  const addDeps = (pkg) => { for (const [k,v] of Object.entries(pkg.dependencies||{})) { if (!k.startsWith('@brushia/')) deps[k] = v; } }; \
  addDeps(config); addDeps(shared); addDeps(db); \
  api.dependencies = deps; \
  delete api.devDependencies; \
  fs.writeFileSync('/app/prod-package.json', JSON.stringify(api,null,2)); \
  console.log('✅ Production deps:', Object.keys(deps).length, 'packages'); \
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

# Install production deps with npm (flat node_modules, includes workspace package deps)
COPY --from=builder /app/prod-package.json ./package.json
RUN npm install --production --legacy-peer-deps 2>&1 | tail -3

# Copy workspace packages into node_modules
COPY --from=builder /app/workspace-packages/ ./node_modules/

# Copy built API and migrations
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["node", "dist/main.js"]
