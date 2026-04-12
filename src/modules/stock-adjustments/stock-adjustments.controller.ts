import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockAdjustmentsService } from './stock-adjustments.service.js';
import { CreateStockAdjustmentDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Stock Adjustments')
@Controller('stock-adjustments')
export class StockAdjustmentsController {
  constructor(
    private readonly stockAdjustmentsService: StockAdjustmentsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateStockAdjustmentDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.stockAdjustmentsService.create(dto, organizationId);
  }

  @Get()
  findAll(
    @OrganizationId() organizationId: string,
    @Query('productId') productId?: string,
    @Query('locationId') locationId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.stockAdjustmentsService.findAll(
      organizationId,
      productId,
      locationId,
      fromDate,
      toDate,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.stockAdjustmentsService.findOne(id, organizationId);
  }
}
