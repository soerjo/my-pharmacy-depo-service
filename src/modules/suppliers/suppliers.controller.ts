import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  create(
    @Body() dto: CreateSupplierDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.suppliersService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.suppliersService.findAll(isActive, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.suppliersService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.suppliersService.update(id, dto, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate supplier' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.suppliersService.remove(id, organizationId);
  }
}
