import { Module } from '@nestjs/common';
import { InboundShipmentsController } from './inbound-shipments.controller.js';
import { InboundShipmentsService } from './inbound-shipments.service.js';

@Module({
  controllers: [InboundShipmentsController],
  providers: [InboundShipmentsService],
  exports: [InboundShipmentsService],
})
export class InboundShipmentsModule {}
