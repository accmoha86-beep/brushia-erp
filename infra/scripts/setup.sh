#!/usr/bin/env bash
# ═══════════════════════════════════════════════════
# Brushia ERP — Development Setup Script
# ═══════════════════════════════════════════════════
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[BRUSHIA]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║     BRUSHIA ERP — Development Setup      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
command -v node >/dev/null 2>&1 || error "Node.js is required (v20+)"
command -v pnpm >/dev/null 2>&1 || error "pnpm is required (v9+)"
command -v docker >/dev/null 2>&1 || error "Docker is required"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20+ is required. Current: $(node -v)"
fi

# Copy environment file
if [ ! -f .env ]; then
    log "Creating .env from .env.example..."
    cp .env.example .env
    log "⚠️  Please update .env with your values"
fi

# Install dependencies
log "Installing dependencies..."
pnpm install

# Start Docker services
log "Starting Docker services..."
docker compose up -d

# Wait for PostgreSQL
log "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U brushia -d brushia >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

# Wait for Redis
log "Waiting for Redis to be ready..."
for i in $(seq 1 15); do
    if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

# Run migrations
log "Running database migrations..."
pnpm db:migrate

# Seed development data
log "Seeding development data..."
pnpm db:seed

echo ""
echo -e "${GREEN}${BOLD}✅ Brushia ERP is ready!${NC}"
echo ""
echo "  API:  http://localhost:3001"
echo "  Web:  http://localhost:3000"
echo "  DB:   postgresql://brushia:brushia_dev_2024@localhost:5432/brushia"
echo ""
echo "  Run: pnpm dev"
echo ""
