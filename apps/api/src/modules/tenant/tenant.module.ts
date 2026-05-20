import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantRepository } from './tenant.repository';

@Module({
  controllers: [TenantController],
  providers: [TenantService, TenantRepository],
  exports: [TenantService],
})
export class TenantModule {}
