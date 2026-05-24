import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchService } from './services/branch.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
