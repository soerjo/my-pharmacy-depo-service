import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispenseOrdersService } from './dispense-orders.service.js';
import {
  CreateDispenseOrderDto,
  UpdateDispenseOrderItemDto,
  CancelDispenseOrderDto,
  DispenseOrderQueryDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/interfaces/auth-user.interface.js';

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
    @Headers('authorization') authorization: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dispenseOrdersService.create(
      dto,
      organizationId,
      authorization,
      user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List dispense orders' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query() query: DispenseOrderQueryDto,
  ) {
    return this.dispenseOrdersService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispense order by ID' })
  findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: string,
    @Headers('authorization') authorization: string,
  ) {
    return this.dispenseOrdersService.getDispenseOrderById(
      id,
      organizationId,
      authorization,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dispense order details (PENDING only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDispenseOrderItemDto,
    @OrganizationId() organizationId: string,
    @Headers('authorization') authorization: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dispenseOrdersService.updateItems(
      id,
      dto,
      organizationId,
      authorization,
      user.id,
    );
  }

  // @Post(':id/items')
  // @ApiOperation({ summary: 'Add item to dispense order (PENDING only)' })
  // addItem(
  //   @Param('id') id: string,
  //   @Body() dto: AddDispenseOrderItemDto,
  //   @OrganizationId() organizationId: string,
  //   @Headers('authorization') authorization: string,
  // ) {
  //   return this.dispenseOrdersService.addItem(
  //     id,
  //     dto,
  //     organizationId,
  //     authorization,
  //   );
  // }

  // @Put(':id/items/')
  // @ApiOperation({ summary: 'Update item in dispense order (PENDING only)' })
  // updateItem(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateDispenseOrderItemDto,
  //   @OrganizationId() organizationId: string,
  //   @Headers('authorization') authorization: string,
  // ) {
  //   return this.dispenseOrdersService.updateItems(
  //     id,
  //     dto,
  //     organizationId,
  //     authorization,
  //   );
  // }

  // @Delete(':id/items/:itemId')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Remove item from dispense order (PENDING only)' })
  // removeItem(
  //   @Param('id') id: string,
  //   @Param('itemId') itemId: string,
  //   @OrganizationId() organizationId: string,
  // ) {
  //   return this.dispenseOrdersService.removeItem(id, itemId, organizationId);
  // }

  @Post(':id/prepare')
  @ApiOperation({
    summary: 'Start preparing dispense order (PENDING → PREPARING)',
  })
  prepare(
    @Param('id') id: string,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dispenseOrdersService.startPreparation(
      id,
      organizationId,
      user.id,
    );
  }

  @Post(':id/dispense')
  @ApiOperation({ summary: 'Dispense order (PREPARING → DISPENSED)' })
  dispense(
    @Param('id') id: string,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dispenseOrdersService.dispense(id, organizationId, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel dispense order (PENDING/PREPARING → CANCELLED)',
  })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelDispenseOrderDto,
    @OrganizationId() organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dispenseOrdersService.cancel(id, dto, organizationId, user.id);
  }
}
