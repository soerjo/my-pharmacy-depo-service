import { Module } from '@nestjs/common';
import { DispenseOrdersController } from './dispense-orders.controller.js';
import { DispenseOrdersService } from './dispense-orders.service.js';

@Module({
  controllers: [DispenseOrdersController],
  providers: [DispenseOrdersService],
  exports: [DispenseOrdersService],
})
export class DispenseOrdersModule {}
