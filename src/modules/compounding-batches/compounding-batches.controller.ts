import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompoundingBatchesService } from './compounding-batches.service.js';
import {
  CreateCompoundingBatchDto,
  UpdateCompoundingStatusDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Compounding Batches')
@Controller('compounding-batches')
export class CompoundingBatchesController {
  constructor(
    private readonly compoundingBatchesService: CompoundingBatchesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a compounding batch' })
  create(
    @Body() dto: CreateCompoundingBatchDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.compoundingBatchesService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all compounding batches' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('status') status?: string,
    @Query('formulaId') formulaId?: string,
  ) {
    return this.compoundingBatchesService.findAll(
      organizationId,
      status,
      formulaId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a compounding batch by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.compoundingBatchesService.findOne(organizationId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update compounding batch status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompoundingStatusDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.compoundingBatchesService.updateStatus(organizationId, id, dto);
  }
}
