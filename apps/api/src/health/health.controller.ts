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
    
    // Check migration files
    const fs = await import('fs');
    const pathMod = await import('path');
    const possiblePaths = [
      pathMod.join(process.cwd(), 'packages/db/migrations'),
      '/app/packages/db/migrations',
    ];
    results.migrationDir = 'not found';
    results.migrationFiles = [];
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          results.migrationDir = p;
          results.migrationFiles = fs.readdirSync(p)
            .filter((f: string) => f.endsWith('.sql'))
            .sort()
            .slice(-5);
          break;
        }
      } catch {}
    }
    
    const tables = [
      'catalog.categories', 'catalog.products', 'inventory.stock_levels',
      'sales.sales_orders', 'purchasing.purchase_orders',
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

  @Get('apply-029')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Apply migration 029 manually' })
  async apply029() {
    // Check if already applied
    const check = await this.pool.query("SELECT 1 FROM public.migrations WHERE name = '029_real_stock_take'");
    if (check.rows.length > 0) {
      return { success: true, message: 'Already applied' };
    }
    
    const fs = await import('fs');
    const pathMod = await import('path');
    const migFile = pathMod.join('/app/packages/db/migrations', '029_real_stock_take.sql');
    
    if (!fs.existsSync(migFile)) {
      return { error: 'File not found' };
    }
    
    const sql = fs.readFileSync(migFile, 'utf-8');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query("INSERT INTO public.migrations (name) VALUES ('029_real_stock_take') ON CONFLICT DO NOTHING");
      await client.query('COMMIT');
      return { success: true, message: 'Migration 029 applied successfully!', sqlLength: sql.length };
    } catch (e: any) {
      await client.query('ROLLBACK');
      return { 
        success: false, 
        error: e.message, 
        detail: e.detail || null,
        hint: e.hint || null,
        position: e.position || null,
        where: e.where || null,
        sqlLength: sql.length,
        first200: sql.substring(0, 200),
        around_error: e.position ? sql.substring(Math.max(0, parseInt(e.position) - 100), parseInt(e.position) + 100) : null
      };
    } finally {
      client.release();
    }
  }

}
