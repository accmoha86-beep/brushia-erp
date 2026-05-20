/**
 * Database connection pool management.
 * Uses postgres.js for maximum performance.
 */

import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

export interface DatabaseConfig {
  url: string;
  poolMin?: number;
  poolMax?: number;
  ssl?: boolean;
  debug?: boolean;
}

export function createConnection(config: DatabaseConfig): ReturnType<typeof postgres> {
  if (_sql) return _sql;

  _sql = postgres(config.url, {
    max: config.poolMax ?? 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: config.ssl ? 'require' : false,
    debug: config.debug ? (connection, query, params) => {
      console.debug('[SQL]', query.substring(0, 200));
    } : undefined,
    transform: {
      undefined: null,
    },
    types: {
      // Force bigint to number (safe for our use case)
      bigint: postgres.BigInt,
    },
  });

  return _sql;
}

export function getConnection(): ReturnType<typeof postgres> {
  if (!_sql) {
    throw new Error('Database not connected. Call createConnection() first.');
  }
  return _sql;
}

export async function closeConnection(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}
