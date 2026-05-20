#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Brushia ERP — Run Critical Workflow Integration Test
# ═══════════════════════════════════════════════════════════════════════════
#
# Prerequisites:
#   1. Docker running: docker compose up -d postgres redis
#   2. Create test DB: docker exec brushia-postgres psql -U brushia -c "CREATE DATABASE brushia_test"
#   3. Run migrations against test DB
#
# Usage: ./scripts/test-critical-workflow.sh
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

echo "🧪 Brushia ERP — Critical Workflow Test"
echo "════════════════════════════════════════"
echo ""

# Check Docker
if ! docker compose ps postgres 2>/dev/null | grep -q "running"; then
  echo "📦 Starting Docker services..."
  docker compose up -d postgres redis
  echo "⏳ Waiting for PostgreSQL..."
  sleep 3
fi

# Create test database if not exists
echo "🗄️  Ensuring test database exists..."
docker exec brushia-postgres psql -U brushia -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'brushia_test'" | grep -q 1 \
  || docker exec brushia-postgres psql -U brushia -c "CREATE DATABASE brushia_test"

# Run migrations
echo "📋 Running migrations..."
for f in apps/api/src/database/migrations/*.sql; do
  docker exec -i brushia-postgres psql -U brushia -d brushia_test < "$f" 2>/dev/null || true
done

echo ""
echo "🚀 Running integration test..."
echo "════════════════════════════════════════"

cd apps/api
npx jest --config test/jest.integration.config.ts \
  --testPathPattern="pos-sale.integration" \
  --verbose \
  --no-cache \
  --forceExit

echo ""
echo "════════════════════════════════════════"
echo "✅ Critical workflow test complete!"
echo ""
echo "What was proven:"
echo "  ✓ POS sale creates order + line items"
echo "  ✓ Split payment recorded correctly"
echo "  ✓ Inventory deducted with advisory locks"
echo "  ✓ Revenue + COGS journal entries balanced"
echo "  ✓ Customer stats + loyalty updated"
echo "  ✓ Audit log written"
echo "  ✓ Outbox event written"
echo "  ✓ All in ONE atomic transaction"
echo "  ✓ Idempotency prevents double-processing"
echo "  ✓ Rollback on insufficient stock"
echo "  ✓ Walk-in (no customer) works"
echo "  ✓ 3-way split payment works"
