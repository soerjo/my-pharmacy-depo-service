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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BatchesService } from './batches.service.js';
import { CreateBatchDto, UpdateBatchDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Batches')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(
    @Body() dto: CreateBatchDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.batchesService.create(dto, organizationId);
  }

  @Get()
  findAll(
    @OrganizationId() organizationId: string,
    @Query('productId') productId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.batchesService.findAll(organizationId, productId, isActive);
  }

  @Get('breakdown/:productId')
  getBatchBreakdown(
    @Param('productId') productId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.batchesService.getBatchBreakdown(productId, organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.batchesService.findOne(id, organizationId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.batchesService.update(id, organizationId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.batchesService.remove(id, organizationId);
  }
}
