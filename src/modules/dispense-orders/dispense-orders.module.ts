import { Module } from '@nestjs/common';
import { DispenseOrdersController } from './dispense-orders.controller.js';
import { DispenseOrdersService } from './dispense-orders.service.js';
import { WarehouseModule } from '../warehouse/warehouse.module.js';

@Module({
  imports: [WarehouseModule],
  controllers: [DispenseOrdersController],
  providers: [DispenseOrdersService],
  exports: [DispenseOrdersService],
})
export class DispenseOrdersModule {}
