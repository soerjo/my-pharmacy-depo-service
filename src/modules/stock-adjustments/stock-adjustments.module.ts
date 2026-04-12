import { Module } from '@nestjs/common';
import { StockAdjustmentsController } from './stock-adjustments.controller.js';
import { StockAdjustmentsService } from './stock-adjustments.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [StockAdjustmentsController],
  providers: [StockAdjustmentsService],
  exports: [StockAdjustmentsService],
})
export class StockAdjustmentsModule {}
