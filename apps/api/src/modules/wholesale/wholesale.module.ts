import { Module } from '@nestjs/common';
import { WholesaleController } from './wholesale.controller';
import { WholesaleService } from './services/wholesale.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WholesaleController],
  providers: [WholesaleService],
  exports: [WholesaleService],
})
export class WholesaleModule {}