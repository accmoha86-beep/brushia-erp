import { Controller, Get, Inject, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
import { Pool } from 'pg';

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
      // Basic liveness — app is running
      () => Promise.resolve({ api: { status: 'up' } }),
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
    } catch (e: any) { results.migrations_error = e.message; }
    
    const tables = [
      'hr.salespersons', 'hr.commissions', 'hr.commission_rules',
      'crm.loyalty_tiers', 'crm.loyalty_transactions',
      'exhibitions.events', 'exhibitions.event_expenses',
      'whatsapp.conversations', 'whatsapp.messages',
      'inventory.stock_counts', 'inventory.stock_count_items',
      'inventory.stock_transfers', 'inventory.stock_transfer_items',
    ];
    results.tables = {};
    for (const t of tables) {
      try {
        const r = await this.pool.query(`SELECT COUNT(*)::int as c FROM ${t}`);
        results.tables[t] = { exists: true, count: r.rows[0].c };
      } catch (e: any) {
        results.tables[t] = { exists: false, error: e.message.substring(0, 100) };
      }
    }
    return results;
  }

  @Get('ready')
  @Version(VERSION_NEUTRAL)
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — checks all dependencies' })
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Redis
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

  @Get('run-migration')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Run migration 029 manually' })
  async runMigration029() {
    const results: any = { steps: [], success: false };
    const t_id = 'a0000000-0000-0000-0000-000000000001';
    
    // Check if already applied
    const check = await this.pool.query("SELECT 1 FROM public.migrations WHERE name = '029_real_stock_take'");
    if (check.rows.length > 0) {
      return { message: 'Migration 029 already applied', success: true };
    }
    
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Test each DELETE individually
      const deletes = [
        `DELETE FROM purchasing.bill_payments WHERE bill_id IN (SELECT id FROM purchasing.vendor_bills WHERE tenant_id = '${t_id}')`,
        `DELETE FROM purchasing.vendor_bills WHERE tenant_id = '${t_id}'`,
        `DELETE FROM purchasing.goods_receipt_items WHERE goods_receipt_id IN (SELECT id FROM purchasing.goods_receipts WHERE tenant_id = '${t_id}')`,
        `DELETE FROM purchasing.goods_receipts WHERE tenant_id = '${t_id}'`,
        `DELETE FROM purchasing.purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchasing.purchase_orders WHERE tenant_id = '${t_id}')`,
        `DELETE FROM purchasing.purchase_orders WHERE tenant_id = '${t_id}'`,
        `DELETE FROM inventory.stock_transfer_items WHERE transfer_id IN (SELECT id FROM inventory.stock_transfers WHERE tenant_id = '${t_id}')`,
        `DELETE FROM inventory.stock_transfers WHERE tenant_id = '${t_id}'`,
        `DELETE FROM inventory.stock_reservations WHERE tenant_id = '${t_id}'`,
        `DELETE FROM inventory.stock_count_items WHERE tenant_id = '${t_id}'`,
        `DELETE FROM inventory.stock_counts WHERE tenant_id = '${t_id}'`,
        `DELETE FROM inventory.stock_movements WHERE tenant_id = '${t_id}'`,
        `DELETE FROM inventory.stock_levels WHERE tenant_id = '${t_id}'`,
        `DELETE FROM sales.order_items WHERE order_id IN (SELECT id FROM sales.sales_orders WHERE tenant_id = '${t_id}')`,
        `DELETE FROM sales.payments WHERE order_id IN (SELECT id FROM sales.sales_orders WHERE tenant_id = '${t_id}')`,
        `DELETE FROM sales.sales_orders WHERE tenant_id = '${t_id}'`,
        `DELETE FROM catalog.product_variants WHERE product_id IN (SELECT id FROM catalog.products WHERE tenant_id = '${t_id}')`,
        `DELETE FROM catalog.products WHERE tenant_id = '${t_id}'`,
        `DELETE FROM catalog.categories WHERE tenant_id = '${t_id}'`,
      ];
      
      for (const sql of deletes) {
        try {
          const r = await client.query(sql);
          const table = sql.split('FROM ')[1].split(' ')[0];
          results.steps.push({ table, status: 'ok', rows: r.rowCount });
        } catch (e: any) {
          const table = sql.split('FROM ')[1].split(' ')[0];
          results.steps.push({ table, status: 'error', error: e.message });
        }
      }
      
      await client.query('ROLLBACK');
      results.message = 'Dry run complete (rolled back). Check steps for errors.';
      results.success = results.steps.every((s: any) => s.status === 'ok');
    } catch (e: any) {
      await client.query('ROLLBACK');
      results.error = e.message;
    } finally {
      client.release();
    }
    
    return results;
  }

}
