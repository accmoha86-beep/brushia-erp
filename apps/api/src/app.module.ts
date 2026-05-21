import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Configuration
import { configuration } from './config/configuration';

// Infrastructure
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { QueueModule } from './queue/queue.module';

// Security
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditModule } from './modules/audit/audit.module';
import { OutboxModule } from './modules/outbox/outbox.module';

// Business Engines
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { SalesModule } from './modules/sales/sales.module';
import { POSModule } from './modules/pos/pos.module';

// New Modules
import { CustomerModule } from './modules/customer/customer.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { WholesaleModule } from './modules/wholesale/wholesale.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { CommissionModule } from './modules/commission/commission.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { StockCountingModule } from './modules/stock-counting/stock-counting.module';
import { ExhibitionModule } from './modules/exhibition/exhibition.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

// Middleware
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    // Configuration (MUST be first)
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Infrastructure
    LoggerModule,
    DatabaseModule,
    RedisModule,
    QueueModule,
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

    // Extended Modules
    CustomerModule,
    PurchasingModule,
    PromotionModule,
    WholesaleModule,
    ShippingModule,
    ReportingModule,
    WarehouseModule,
    CommissionModule,
    LoyaltyModule,
    StockCountingModule,
    ExhibitionModule,
    WhatsAppModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
    consumer
      .apply(TenantMiddleware)
      .exclude('health', 'health/(.*)', 'auth/login', 'auth/register', 'docs', 'docs/(.*)', 'webhook', 'webhook/(.*)', 'tenants', 'tenants/(.*)')
      .forRoutes('*');
  }
}
