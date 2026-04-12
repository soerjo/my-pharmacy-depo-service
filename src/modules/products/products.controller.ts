import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  create(
    @Body() dto: CreateProductDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.productsService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('isActive') isActive?: string,
    @Query('productType') productType?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll(
      organizationId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      productType,
      search,
      categoryId,
    );
  }

  @Get('stock')
  @ApiOperation({ summary: 'Get product stock list' })
  getStockList(@OrganizationId() organizationId: string) {
    return this.productsService.getStockList(organizationId);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Get product catalog' })
  getCatalog(@OrganizationId() organizationId: string) {
    return this.productsService.getCatalog(organizationId);
  }

  @Get('raw-materials')
  @ApiOperation({ summary: 'Get raw material stock list' })
  getRawMaterials(@OrganizationId() organizationId: string) {
    return this.productsService.getRawMaterialStockList(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.productsService.findOne(organizationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.productsService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a product' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.productsService.remove(organizationId, id);
  }
}
