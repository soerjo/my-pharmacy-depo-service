import { Module } from '@nestjs/common';
import { BatchesController } from './batches.controller.js';
import { BatchesService } from './batches.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
