import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379'),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379, password: undefined };
  }
}

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url');
        const conn = url ? parseRedisUrl(url) : {
          host: config.get('redis.host', 'localhost'),
          port: config.get('redis.port', 6379),
          password: config.get('redis.password') || undefined,
        };
        return {
          connection: conn,
          prefix: config.get('queue.prefix', 'bloom'),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { age: 86400, count: 1000 },
            removeOnFail: { age: 604800 },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
