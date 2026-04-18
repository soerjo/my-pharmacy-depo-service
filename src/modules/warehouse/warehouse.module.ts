import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WarehouseService } from './warehouse.service.js';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
