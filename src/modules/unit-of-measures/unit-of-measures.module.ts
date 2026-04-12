import { Module } from '@nestjs/common';
import { UnitOfMeasuresController } from './unit-of-measures.controller.js';
import { UnitOfMeasuresService } from './unit-of-measures.service.js';

@Module({
  controllers: [UnitOfMeasuresController],
  providers: [UnitOfMeasuresService],
  exports: [UnitOfMeasuresService],
})
export class UnitOfMeasuresModule {}
