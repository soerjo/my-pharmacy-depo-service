import { Module } from '@nestjs/common';
import { OutboundShipmentsController } from './outbound-shipments.controller.js';
import { OutboundShipmentsService } from './outbound-shipments.service.js';

@Module({
  controllers: [OutboundShipmentsController],
  providers: [OutboundShipmentsService],
  exports: [OutboundShipmentsService],
})
export class OutboundShipmentsModule {}
