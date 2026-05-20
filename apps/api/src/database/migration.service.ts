import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from './database.constants';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      await this.runMigrations();
    } catch (error) {
      this.logger.error('Migration failed — app will continue but DB may not be ready', error);
    }
  }

  private async runMigrations() {
    this.logger.log('Running database migrations...');

    // Find migrations directory
    const possiblePaths = [
      path.join(__dirname, '../../../../packages/db/migrations'),
      path.join(__dirname, '../../../packages/db/migrations'),
      path.join(process.cwd(), 'packages/db/migrations'),
      '/app/packages/db/migrations',
    ];

    let migrationsDir = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        migrationsDir = p;
        break;
      }
    }

    if (!migrationsDir) {
      this.logger.warn('No migrations directory found. Skipping migrations.');
      return;
    }

    // Ensure migrations tracking table exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get already-applied migrations
    const applied = await this.pool.query('SELECT name FROM public.migrations ORDER BY id');
    const appliedSet = new Set(applied.rows.map((r: any) => r.name));

    // Find SQL files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const name = file.replace('.sql', '');
      if (appliedSet.has(name)) {
        this.logger.log(`Migration ${name} already applied, skipping.`);
        continue;
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
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error(`❌ Migration ${name} failed:`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    this.logger.log('All migrations complete.');
  }
}
