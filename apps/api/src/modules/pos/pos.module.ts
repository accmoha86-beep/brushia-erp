// ═══════════════════════════════════════════════════════════════════════════
// POS Module — Updated with Sale Transaction Orchestrator
// ═══════════════════════════════════════════════════════════════════════════
import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './services/pos.service';
import { SaleTransactionOrchestrator } from './orchestrators/sale-transaction.orchestrator';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SalesModule } from '../sales/sales.module';
import { OutboxModule } from '../outbox/outbox.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [InventoryModule, AccountingModule, SalesModule, OutboxModule, AuditModule],
  controllers: [PosController],
  providers: [PosService, SaleTransactionOrchestrator],
  exports: [PosService, SaleTransactionOrchestrator],
})
export class PosModule {}
