import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service.js';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Product Categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  create(
    @Body() dto: CreateProductCategoryDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.productCategoriesService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List product categories' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('parentId') parentId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const parsedIsActive =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.productCategoriesService.findAll(
      organizationId,
      parentId,
      parsedIsActive,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product category by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.productCategoriesService.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product category' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.productCategoriesService.update(id, organizationId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate product category' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.productCategoriesService.remove(id, organizationId);
  }
}
