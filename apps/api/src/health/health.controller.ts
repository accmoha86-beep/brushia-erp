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
      () => Promise.resolve({ api: { status: 'up', build: '030-fix-v2', ts: new Date().toISOString() } }),
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
