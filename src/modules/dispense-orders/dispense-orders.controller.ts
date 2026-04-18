import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispenseOrdersService } from './dispense-orders.service.js';
import {
  CreateDispenseOrderDto,
  UpdateDispenseOrderDto,
  AddDispenseOrderItemDto,
  UpdateDispenseOrderItemDto,
  CancelDispenseOrderDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiBearerAuth()
@ApiTags('Dispense Orders')
@Controller('dispense-orders')
export class DispenseOrdersController {
  constructor(private readonly dispenseOrdersService: DispenseOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dispense order (PENDING)' })
  create(
    @Body() dto: CreateDispenseOrderDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.dispenseOrdersService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List dispense orders' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('admissionId') admissionId?: string,
    @Query('type') type?: string,
  ) {
    return this.dispenseOrdersService.findAll(
      organizationId,
      pagination,
      status,
      patientId,
      admissionId,
      type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispense order by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.dispenseOrdersService.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dispense order details (PENDING only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDispenseOrderDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.dispenseOrdersService.update(id, dto, organizationId);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to dispense order (PENDING only)' })
  addItem(
    @Param('id') id: string,
    @Body() dto: AddDispenseOrderItemDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.dispenseOrdersService.addItem(id, dto, organizationId);
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: 'Update item in dispense order (PENDING only)' })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateDispenseOrderItemDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.dispenseOrdersService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
    );
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from dispense order (PENDING only)' })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @OrganizationId() organizationId: string,
  ) {
    return this.dispenseOrdersService.removeItem(id, itemId, organizationId);
  }

  @Patch(':id/prepare')
  @ApiOperation({
    summary: 'Start preparing dispense order (PENDING → PREPARING)',
  })
  prepare(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.dispenseOrdersService.startPreparation(id, organizationId);
  }

  @Patch(':id/dispense')
  @ApiOperation({ summary: 'Dispense order (PREPARING → DISPENSED)' })
  dispense(
    @Param('id') id: string,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dispenseOrdersService.dispense(id, organizationId, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel dispense order (PENDING/PREPARING → CANCELLED)',
  })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelDispenseOrderDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.dispenseOrdersService.cancel(id, dto, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete dispense order (PENDING only)' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.dispenseOrdersService.remove(id, organizationId);
  }
}
