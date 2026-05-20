import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection, closeConnection } from '@brushia/db';
import { LoggerService } from '../logger/logger.service';
import { DATABASE_CONNECTION } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (config: ConfigService, logger: LoggerService) => {
        const url = config.getOrThrow<string>('database.url');
        const poolMax = config.get<number>('database.poolMax', 10);
        const ssl = config.get<boolean>('database.ssl', false);
        const debug = config.get<string>('app.env') === 'development';

        logger.log(`Connecting to PostgreSQL (pool: ${poolMax})...`, 'Database');

        return createConnection({
          url,
          poolMax,
          ssl,
          debug,
        });
      },
      inject: [ConfigService, LoggerService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await closeConnection();
  }
}
