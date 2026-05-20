import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DATABASE_CONNECTION } from './database.constants';

@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly pool: Pool) {}

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
