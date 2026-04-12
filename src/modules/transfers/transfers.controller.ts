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
import { TransferStatus } from '@prisma/client';
import { TransfersService } from './transfers.service.js';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transfer' })
  create(
    @Body() dto: CreateTransferDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.transfersService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all transfers' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('status') status?: TransferStatus,
    @Query('productId') productId?: string,
    @Query('fromLocationId') fromLocationId?: string,
    @Query('toLocationId') toLocationId?: string,
  ) {
    return this.transfersService.findAll(
      organizationId,
      status,
      productId,
      fromLocationId,
      toLocationId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transfer by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.transfersService.findOne(organizationId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update transfer status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransferStatusDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.transfersService.updateStatus(organizationId, id, dto);
  }
}
