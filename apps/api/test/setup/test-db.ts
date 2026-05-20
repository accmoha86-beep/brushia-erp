// ═══════════════════════════════════════════════════════════════════════════
// Test Database — Isolated PostgreSQL for integration tests
// ═══════════════════════════════════════════════════════════════════════════
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB_URL = process.env.TEST_DATABASE_URL
  ?? 'postgresql://brushia:brushia_dev@localhost:5432/brushia_test';

let pool: Pool;

export async function getTestPool(): Promise<Pool> {
  if (!pool) {
    pool = new Pool({ connectionString: TEST_DB_URL, max: 5 });
  }
  return pool;
}

export async function setupTestDatabase(): Promise<Pool> {
  const p = await getTestPool();

  // Run all migrations in order
  const migrationsDir = path.resolve(__dirname, '../../src/database/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await p.query(sql);
    } catch (err: any) {
      // Ignore "already exists" errors for idempotent re-runs
      if (!err.message.includes('already exists')) {
        console.error(`Migration failed: ${file}`, err.message);
        throw err;
      }
    }
  }

  return p;
}

export async function teardownTestDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

export async function cleanTestData(p: Pool, tenantId: string): Promise<void> {
  // Clean in dependency order (children first)
  const tables = [
    'public.outbox',
    'public.idempotency_keys',
    'public.audit_log',
    'crm.loyalty_points',
    'sales.payments',
    'sales.order_items',
    'sales.orders',
    'inventory.stock_movements',
    'inventory.stock_levels',
    'accounting.journal_entry_lines',
    'accounting.journal_entries',
    'accounting.chart_of_accounts',
    'pos.register_sessions',
    'pos.registers',
    'catalog.products',
    'catalog.categories',
    'crm.customers',
    'settings.locations',
    'iam.user_roles',
    'iam.role_permissions',
    'iam.roles',
    'iam.users',
    'iam.tenants',
  ];

  for (const table of tables) {
    try {
      await p.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [tenantId]);
    } catch {
      // Some tables may not have tenant_id — skip
      try {
        await p.query(`DELETE FROM ${table}`);
      } catch {
        // Table may not exist yet
      }
    }
  }
}
