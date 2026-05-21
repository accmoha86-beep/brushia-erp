import { Module } from '@nestjs/common';
import { StockCountingController } from './stock-counting.controller';
import { StockCountingService } from './services/stock-counting.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StockCountingController],
  providers: [StockCountingService],
  exports: [StockCountingService],
})
export class StockCountingModule {}
