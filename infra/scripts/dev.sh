#!/usr/bin/env bash
# Quick development start
set -euo pipefail

echo "🚀 Starting Brushia ERP development..."

# Ensure Docker services are running
docker compose up -d 2>/dev/null || echo "⚠️  Docker services not available"

# Start all apps in dev mode
pnpm dev
