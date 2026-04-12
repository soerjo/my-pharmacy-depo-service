import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ManufacturersService } from './manufacturers.service.js';
import { CreateManufacturerDto, UpdateManufacturerDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Manufacturers')
@Controller('manufacturers')
export class ManufacturersController {
  constructor(private readonly manufacturersService: ManufacturersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a manufacturer' })
  create(
    @Body() dto: CreateManufacturerDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.manufacturersService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all manufacturers' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.manufacturersService.findAll(
      organizationId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a manufacturer by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.manufacturersService.findOne(organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a manufacturer' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateManufacturerDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.manufacturersService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a manufacturer' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.manufacturersService.remove(organizationId, id);
  }
}
