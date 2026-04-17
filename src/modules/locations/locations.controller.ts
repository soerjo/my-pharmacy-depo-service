import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto, UpdateLocationDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create location' })
  create(
    @Body() dto: CreateLocationDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.locationsService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List locations' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.locationsService.findAll(
      organizationId,
      type,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.locationsService.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update location' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.locationsService.update(id, dto, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate location' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.locationsService.remove(id, organizationId);
  }
}
