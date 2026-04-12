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
import { InboundShipmentsService } from './inbound-shipments.service.js';
import {
  CreateInboundShipmentDto,
  UpdateInboundStatusDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Inbound Shipments')
@Controller('inbound-shipments')
export class InboundShipmentsController {
  constructor(
    private readonly inboundShipmentsService: InboundShipmentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an inbound shipment' })
  create(
    @Body() dto: CreateInboundShipmentDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.inboundShipmentsService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inbound shipments' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inboundShipmentsService.findAll(
      organizationId,
      status,
      supplierId,
      from,
      to,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inbound shipment by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.inboundShipmentsService.findOne(organizationId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inbound shipment status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInboundStatusDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.inboundShipmentsService.updateStatus(organizationId, id, dto);
  }
}
