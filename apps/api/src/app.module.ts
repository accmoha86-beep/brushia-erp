import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

// Infrastructure
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';

// Security
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditModule } from './modules/audit/audit.module';

// Business Engines
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { SalesModule } from './modules/sales/sales.module';
import { POSModule } from './modules/pos/pos.module';

// Middleware
import { TenantMiddleware } from './modules/tenant/tenant.middleware';
import { CorrelationMiddleware } from './common/middleware/correlation.middleware';

@Module({
  imports: [
    // Rate Limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Infrastructure
    DatabaseModule,
    RedisModule,
    HealthModule,
    OutboxModule,

    // Security & IAM
    TenantModule,
    AuthModule,
    RbacModule,
    AuditModule,

    // Business Engines
    CatalogModule,
    InventoryModule,
    AccountingModule,
    SalesModule,
    POSModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes('*');
    consumer
      .apply(TenantMiddleware)
      .exclude('health', 'health/(.*)', 'auth/login', 'auth/register', 'docs', 'docs/(.*)')
      .forRoutes('*');
  }
}
