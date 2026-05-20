# 🎨 Brushia ERP

> Enterprise Beauty & Cosmetics Management Platform

Premium ERP + POS + Accounting + Inventory + CRM platform specialized for beauty and cosmetics businesses in Egypt.

## Architecture

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: NestJS (modular monolith)
- **Frontend**: Next.js 15 + Tailwind + shadcn/ui
- **Database**: PostgreSQL 16 (schema-per-domain)
- **Cache/Queue**: Redis 7 + BullMQ
- **ORM**: Drizzle ORM

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+, Docker

# 1. Clone & setup
git clone <repo-url>
cd brushia-erp

# 2. Run setup script
bash infra/scripts/setup.sh

# 3. Start development
pnpm dev
```

## Project Structure

```
brushia-erp/
├── apps/
│   ├── api/          # NestJS API server
│   └── web/          # Next.js frontend
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── config/       # Environment validation
│   ├── db/           # Database schema & migrations
│   └── eslint-config/# Shared ESLint rules
├── infra/
│   ├── docker/       # Docker configs
│   └── scripts/      # Dev scripts
└── docs/             # Documentation
```

## Services

| Service    | URL                          |
|-----------|------------------------------|
| Web       | http://localhost:3000         |
| API       | http://localhost:3001         |
| API Docs  | http://localhost:3001/docs    |
| PostgreSQL| localhost:5432               |
| Redis     | localhost:6379               |

## Commands

```bash
pnpm dev          # Start all services
pnpm build        # Build all packages
pnpm lint         # Lint all code
pnpm typecheck    # Type check
pnpm test         # Run tests
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed development data
pnpm docker:up    # Start Docker services
pnpm docker:down  # Stop Docker services
```

## License

UNLICENSED — Proprietary
