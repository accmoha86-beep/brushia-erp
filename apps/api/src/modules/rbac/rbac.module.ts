import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { RbacRepository } from './rbac.repository';

@Module({
  controllers: [RbacController],
  providers: [RbacService, RbacRepository],
  exports: [RbacService],
})
export class RbacModule {}
