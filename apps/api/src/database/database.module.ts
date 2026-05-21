import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from './database.constants';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

const RAW_POOL = 'DATABASE_RAW_POOL';

@Global()
@Module({
  providers: [
    // Raw pg.Pool — for DatabaseService, MigrationService, and SaleTransactionOrchestrator
    {
      provide: RAW_POOL,
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL is required');
        return new Pool({
          connectionString: url,
          max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });
      },
    },
    // Drizzle ORM instance — for repositories that use @Inject(DB_CONNECTION)
    {
      provide: DATABASE_CONNECTION,
      inject: [RAW_POOL],
      useFactory: (pool: Pool) => drizzle(pool),
    },
    DatabaseService,
    MigrationService,
  ],
  exports: [DATABASE_CONNECTION, RAW_POOL, DatabaseService],
})
export class DatabaseModule {}

export { RAW_POOL };
