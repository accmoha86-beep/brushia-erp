import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
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
    DatabaseService,
  ],
  exports: [DATABASE_CONNECTION, DatabaseService],
})
export class DatabaseModule {}
