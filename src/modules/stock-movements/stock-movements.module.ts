import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller.js';
import { StockMovementsService } from './stock-movements.service.js';

@Module({
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
