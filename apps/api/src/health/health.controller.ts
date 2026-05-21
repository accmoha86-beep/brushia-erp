import { Controller, Get, Inject } from '@nestjs/common';
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
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Basic liveness — app is running
      () => Promise.resolve({ api: { status: 'up' } }),
    ]);
  }

  @Get('db')
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
}
