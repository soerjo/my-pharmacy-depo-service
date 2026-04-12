import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  getLowStockAlerts(@OrganizationId() organizationId: string) {
    return this.stockService.getLowStockAlerts(organizationId);
  }

  @Get('alerts/expiring')
  @ApiOperation({ summary: 'Get expiring batch alerts' })
  getExpiringBatchAlerts(@OrganizationId() organizationId: string) {
    return this.stockService.getExpiringBatchAlerts(organizationId);
  }

  @Get('alerts/overstock')
  @ApiOperation({ summary: 'Get overstock alerts' })
  getOverstockAlerts(@OrganizationId() organizationId: string) {
    return this.stockService.getOverstockAlerts(organizationId);
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'Get stock by location' })
  getStockByLocation(
    @Param('locationId') locationId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.stockService.getStockByLocation(locationId, organizationId);
  }

  @Get('product/:productId/total')
  @ApiOperation({ summary: 'Get total stock for a product' })
  getTotalStock(
    @Param('productId') productId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.stockService.getTotalStock(productId, organizationId);
  }
}
