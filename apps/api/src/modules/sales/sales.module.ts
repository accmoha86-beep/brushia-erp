import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './services/sales.service';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';
import { AuditModule } from '../audit/audit.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [DatabaseModule, InventoryModule, AccountingModule, AuditModule, OutboxModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
