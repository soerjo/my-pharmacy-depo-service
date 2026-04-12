import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OutboundShipmentStatus } from '@prisma/client';
import { OutboundShipmentsService } from './outbound-shipments.service.js';
import {
  CreateOutboundShipmentDto,
  UpdateOutboundStatusDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Outbound Shipments')
@Controller('outbound-shipments')
export class OutboundShipmentsController {
  constructor(
    private readonly outboundShipmentsService: OutboundShipmentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an outbound shipment' })
  create(
    @Body() dto: CreateOutboundShipmentDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.outboundShipmentsService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all outbound shipments' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('status') status?: OutboundShipmentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.outboundShipmentsService.findAll(
      organizationId,
      status,
      from,
      to,
    );
  }

  @Get('fifo-suggest')
  @ApiOperation({ summary: 'Suggest FIFO batch for a product and location' })
  suggestFifoBatch(
    @Query('productId') productId: string,
    @Query('locationId') locationId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.outboundShipmentsService.suggestFifoBatch(
      organizationId,
      productId,
      locationId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an outbound shipment by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.outboundShipmentsService.findOne(organizationId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update outbound shipment status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOutboundStatusDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.outboundShipmentsService.updateStatus(organizationId, id, dto);
  }
}
