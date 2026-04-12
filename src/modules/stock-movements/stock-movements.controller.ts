import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { StockMovementsService } from './stock-movements.service.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Stock Movements')
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all stock movements' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('movementType') movementType?: StockMovementType,
    @Query('productId') productId?: string,
    @Query('locationId') locationId?: string,
    @Query('batchId') batchId?: string,
    @Query('referenceId') referenceId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.stockMovementsService.findAll(
      organizationId,
      movementType,
      productId,
      locationId,
      batchId,
      referenceId,
      fromDate,
      toDate,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get('reference/:referenceId')
  @ApiOperation({ summary: 'Get stock movements by reference ID' })
  getByReference(
    @Param('referenceId') referenceId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.stockMovementsService.getByReference(
      organizationId,
      referenceId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock movement by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.stockMovementsService.findOne(organizationId, id);
  }
}
