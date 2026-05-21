import { Module } from '@nestjs/common';
import { ExhibitionController } from './exhibition.controller';
import { ExhibitionService } from './services/exhibition.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExhibitionController],
  providers: [ExhibitionService],
  exports: [ExhibitionService],
})
export class ExhibitionModule {}
