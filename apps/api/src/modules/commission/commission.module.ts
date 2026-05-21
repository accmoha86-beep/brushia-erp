import { Module } from '@nestjs/common';
import { CommissionController } from './commission.controller';
import { CommissionService } from './services/commission.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
