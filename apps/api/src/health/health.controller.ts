import { Controller, Get, Inject, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly redis: RedisService,
    @Inject('DATABASE_RAW_POOL') private readonly pool: Pool,
  ) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => Promise.resolve({ api: { status: 'up', build: '030-diag-v3', ts: new Date().toISOString() } }),
    ]);
  }

  @Get('db')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Database diagnostics' })
  async dbCheck() {
    const results: any = {};
    try {
      const mig = await this.pool.query('SELECT name, applied_at FROM public.migrations ORDER BY id');
      results.migrations = mig.rows;
      results.migrationCount = mig.rows.length;
    } catch (e: any) { results.migrations_error = e.message; }
    
    const tables = [
      'catalog.categories', 'catalog.products', 'inventory.stock_levels',
      'inventory.warehouses', 'sales.sales_orders', 'sales.customers',
      'purchasing.purchase_orders', 'purchasing.vendors',
    ];
    results.tables = {};
    for (const t of tables) {
      try {
        const r = await this.pool.query(`SELECT COUNT(*)::int as c FROM ${t}`);
        results.tables[t] = r.rows[0].c;
      } catch (e: any) {
        results.tables[t] = `error: ${e.message.substring(0, 80)}`;
      }
    }
    return results;
  }

  @Get('test-migration')
  @Version(VERSION_NEUTRAL)
  async testMigration() {
    const results: any = { steps: [] };
    const client = await this.pool.connect();
    
    try {
      // Test Step 1: New Category
      try {
        await client.query("BEGIN");
        await client.query("INSERT INTO catalog.categories (id, tenant_id, name, name_ar, slug, sort_order, is_active) VALUES ('c1000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'Glue Super Strong', 'صمغ سوبر استرونج', 'glue-super-strong', 16, true) ON CONFLICT DO NOTHING");
        await client.query("ROLLBACK");
        results.steps.push({ step: 'categories', status: 'ok' });
      } catch (e: any) {
        await client.query("ROLLBACK");
        results.steps.push({ step: 'categories', status: 'error', message: e.message });
      }

      // Test Step 2: A product insert
      try {
        await client.query("BEGIN");
        await client.query("INSERT INTO catalog.products (id, tenant_id, category_id, sku, name, name_ar, slug, base_price, cost_price, product_type, is_active, status, track_inventory, low_stock_threshold, tax_rate) VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'TEST-001', 'Test', 'تست', 'test-001', 10000, 5000, 'simple', true, 'active', true, 5, 14.00) ON CONFLICT DO NOTHING");
        await client.query("ROLLBACK");
        results.steps.push({ step: 'products', status: 'ok' });
      } catch (e: any) {
        await client.query("ROLLBACK");
        results.steps.push({ step: 'products', status: 'error', message: e.message });
      }

      // Test Step 3: Customer insert
      try {
        await client.query("BEGIN");
        await client.query("INSERT INTO sales.customers (id, tenant_id, customer_number, first_name, last_name, phone, customer_type, governorate, city, total_orders, total_spent) VALUES ('aaaaaaaa-bbbb-cccc-dddd-ffffffffffff', 'a0000000-0000-0000-0000-000000000001', 'CUST-TEST', 'Test', 'User', '+201234567890', 'retail', 'Cairo', 'Cairo', 0, 0) ON CONFLICT DO NOTHING");
        await client.query("ROLLBACK");
        results.steps.push({ step: 'customers', status: 'ok' });
      } catch (e: any) {
        await client.query("ROLLBACK");
        results.steps.push({ step: 'customers', status: 'error', message: e.message });
      }

      // Now try the ACTUAL migration file (first 50 statements)
      const possiblePaths = [
        '/app/packages/db/migrations/030_real_sales_data.sql',
        path.join(process.cwd(), 'packages/db/migrations/030_real_sales_data.sql'),
      ];
      
      let migSql = '';
      for (const p of possiblePaths) {
        results.steps.push({ step: 'check-path', path: p, exists: fs.existsSync(p) });
        if (fs.existsSync(p)) {
          migSql = fs.readFileSync(p, 'utf-8');
          results.migFileSize = migSql.length;
          results.migFileLines = migSql.split('\n').length;
          break;
        }
      }

      if (migSql) {
        // Try running the full migration in a transaction (will rollback)
        try {
          await client.query("BEGIN");
          await client.query(migSql);
          // Count what was created
          const cats = await client.query("SELECT COUNT(*)::int as c FROM catalog.categories WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'");
          const prods = await client.query("SELECT COUNT(*)::int as c FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'");
          const custs = await client.query("SELECT COUNT(*)::int as c FROM sales.customers WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'");
          const ords = await client.query("SELECT COUNT(*)::int as c FROM sales.sales_orders WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'");
          
          results.afterMigration = {
            categories: cats.rows[0].c,
            products: prods.rows[0].c,
            customers: custs.rows[0].c,
            orders: ords.rows[0].c,
          };
          results.migrationResult = 'SUCCESS';
          await client.query("ROLLBACK"); // Don't commit - just testing
        } catch (e: any) {
          await client.query("ROLLBACK");
          results.migrationResult = 'FAILED';
          results.migrationError = e.message;
          results.migrationErrorDetail = e.detail || null;
          results.migrationErrorPosition = e.position || null;
        }
      }
    } finally {
      client.release();
    }
    
    return results;
  }

  @Get('ready')
  @Version(VERSION_NEUTRAL)
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        try {
          const client = this.redis.getClient();
          await client.ping();
          return { redis: { status: 'up' } };
        } catch {
          return { redis: { status: 'down' } };
        }
      },
    ]);
  }
}
