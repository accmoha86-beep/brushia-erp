import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('redis.url');
    
    if (url && url !== 'redis://localhost:6379') {
      // Use URL-based connection (Railway, production)
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) return null;
          return Math.min(times * 500, 3000);
        },
        lazyConnect: true,
      });
    } else {
      // Use host/port connection (development)
      this.client = new Redis({
        host: this.config.get('redis.host', 'localhost'),
        port: this.config.get('redis.port', 6379),
        password: this.config.get('redis.password') || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) return null;
          return Math.min(times * 500, 3000);
        },
        lazyConnect: true,
      });
    }

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    try {
      await this.client.connect();
    } catch (err: any) {
      this.logger.warn(`Redis connection failed: ${err.message} — continuing without Redis`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch { return null; }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {}
  }

  async del(key: string): Promise<void> {
    try { await this.client.del(key); } catch {}
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) await this.client.del(...keys);
    } catch {}
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    try {
      const result = await this.client.set(`lock:${key}`, '1', 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch { return false; }
  }

  async releaseLock(key: string): Promise<void> {
    try { await this.client.del(`lock:${key}`); } catch {}
  }
}
