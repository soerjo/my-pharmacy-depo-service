import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UnitOfMeasuresService } from './unit-of-measures.service.js';
import { CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiTags('Unit of Measures')
@ApiBearerAuth()
@Controller('unit-of-measures')
export class UnitOfMeasuresController {
  constructor(private service: UnitOfMeasuresService) {}

  @Post()
  @ApiOperation({ summary: 'Create unit of measure' })
  create(
    @Body() dto: CreateUnitOfMeasureDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.service.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List all units of measure' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll(
      organizationId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit of measure by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.service.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update unit of measure' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUnitOfMeasureDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.service.update(id, dto, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate unit of measure' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.service.remove(id, organizationId);
  }
}
