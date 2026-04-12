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
import { PurchaseOrdersService } from './purchase-orders.service.js';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/index.js';
import { PurchaseOrderStatus } from '@prisma/client';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Purchase Orders')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase order' })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.purchaseOrdersService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all purchase orders' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.purchaseOrdersService.findAll(
      organizationId,
      status as PurchaseOrderStatus | undefined,
      supplierId,
      from,
      to,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.purchaseOrdersService.findOne(organizationId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update purchase order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.purchaseOrdersService.updateStatus(organizationId, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  cancel(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.purchaseOrdersService.cancel(organizationId, id);
  }
}
