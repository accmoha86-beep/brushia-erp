import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Global module — AuditService is available everywhere
 * without explicit imports.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
