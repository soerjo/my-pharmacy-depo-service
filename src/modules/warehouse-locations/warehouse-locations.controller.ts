import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';
import { WarehouseLocationsService } from './warehouse-locations.service.js';
import {
  CreateWarehouseLocationDto,
  UpdateWarehouseLocationDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Warehouse Locations')
@Controller('warehouse-locations')
export class WarehouseLocationsController {
  constructor(
    private readonly warehouseLocationsService: WarehouseLocationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create warehouse location' })
  create(
    @Body() dto: CreateWarehouseLocationDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.warehouseLocationsService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List warehouse locations' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('isActive') isActive?: string,
    @Query('locationType') locationType?: LocationType,
  ) {
    return this.warehouseLocationsService.findAll(
      organizationId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      locationType,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse location by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.warehouseLocationsService.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update warehouse location' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseLocationDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.warehouseLocationsService.update(id, organizationId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate warehouse location' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.warehouseLocationsService.remove(id, organizationId);
  }
}
