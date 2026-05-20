import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

/**
 * Global queue module using BullMQ + Redis.
 * Each domain module registers its own queue processors.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host', 'localhost'),
          port: config.get('redis.port', 6379),
          password: config.get('redis.password') || undefined,
        },
        prefix: config.get('queue.prefix', 'brushia'),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 86400,    // Keep completed jobs for 24h
            count: 1000,   // Keep last 1000
          },
          removeOnFail: {
            age: 604800,   // Keep failed jobs for 7 days
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
