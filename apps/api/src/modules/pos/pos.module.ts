import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { POSController } from './pos.controller';
import { POSService } from './services/pos.service';
import { SaleTransactionOrchestrator } from './orchestrators/sale-transaction.orchestrator';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [POSController],
  providers: [POSService, SaleTransactionOrchestrator],
  exports: [POSService],
})
export class PosModule {}

// Re-export as POSModule for backward compat
export { PosModule as POSModule };
