import { Module } from '@nestjs/common';
import { WarehouseLocationsService } from './warehouse-locations.service.js';
import { WarehouseLocationsController } from './warehouse-locations.controller.js';

@Module({
  controllers: [WarehouseLocationsController],
  providers: [WarehouseLocationsService],
  exports: [WarehouseLocationsService],
})
export class WarehouseLocationsModule {}
