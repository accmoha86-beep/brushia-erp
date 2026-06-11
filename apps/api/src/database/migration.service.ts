import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(@Inject('DATABASE_RAW_POOL') private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      await this.runMigrations();
    } catch (error: any) {
      this.logger.error(`Migration failed: ${error.message} — app will continue but DB may not be ready`);
    }
  }

  private async runMigrations() {
    this.logger.log('Running database migrations (v2 — June 2026)...');

    const possiblePaths = [
      path.join(process.cwd(), 'packages/db/migrations'),
      '/app/packages/db/migrations',
      '/app/migrations',
      path.join(__dirname, '../../../../packages/db/migrations'),
      path.join(__dirname, '../../../packages/db/migrations'),
    ];

    let migrationsDir = '';
    for (const p of possiblePaths) {
      this.logger.log(`Checking migration path: ${p} → exists: ${fs.existsSync(p)}`);
      if (fs.existsSync(p)) {
        migrationsDir = p;
        break;
      }
    }

    if (!migrationsDir) {
      this.logger.warn('No migrations directory found. Paths checked: ' + possiblePaths.join(', '));
      return;
    }

    this.logger.log(`Using migrations from: ${migrationsDir}`);

    // Ensure tracking table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = await this.pool.query('SELECT name FROM public.migrations ORDER BY id');
    const appliedSet = new Set(applied.rows.map((r: any) => r.name));

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.startsWith('seed'))
      .sort();

    this.logger.log(`Found ${files.length} migration files, ${appliedSet.size} already applied`);

    for (const file of files) {
      const name = file.replace('.sql', '');
      if (appliedSet.has(name)) {
        continue; // Already applied, skip silently
      }

      this.logger.log(`Applying migration: ${name}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO public.migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
        await client.query('COMMIT');
        this.logger.log(`✅ Migration ${name} applied successfully`);
      } catch (error: any) {
        await client.query('ROLLBACK');
        this.logger.error(`❌ Migration ${name} failed: ${error.message}`);
        throw error;
      } finally {
        client.release();
      }
    }

    // Run seed if exists and not yet seeded
    const seedFile = path.join(migrationsDir, 'seed.sql');
    if (fs.existsSync(seedFile) && !appliedSet.has('seed')) {
      this.logger.log('Applying seed data...');
      const seedSql = fs.readFileSync(seedFile, 'utf-8');
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(seedSql);
        await client.query('INSERT INTO public.migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', ['seed']);
        await client.query('COMMIT');
        this.logger.log('✅ Seed data applied');
      } catch (error: any) {
        await client.query('ROLLBACK');
        this.logger.error(`❌ Seed failed: ${error.message}`);
      } finally {
        client.release();
      }
    }

    this.logger.log('All migrations complete.');
  }
}
