import { Module } from '@nestjs/common';
import { CompoundingBatchesController } from './compounding-batches.controller.js';
import { CompoundingBatchesService } from './compounding-batches.service.js';

@Module({
  controllers: [CompoundingBatchesController],
  providers: [CompoundingBatchesService],
  exports: [CompoundingBatchesService],
})
export class CompoundingBatchesModule {}
