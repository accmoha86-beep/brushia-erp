import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis({
      host: this.config.get('redis.host', 'localhost'),
      port: this.config.get('redis.port', 6379),
      password: this.config.get('redis.password') || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`, undefined, 'Redis');
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis', 'Redis');
    });

    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // ─── Cache Helpers ───

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // ─── Distributed Lock ───

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.client.set(
      `lock:${key}`,
      '1',
      'PX',
      ttlMs,
      'NX',
    );
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(`lock:${key}`);
  }
}
