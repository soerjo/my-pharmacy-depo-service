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
import { RoomCategoriesService } from './room-categories.service.js';
import {
  CreateRoomCategoryDto,
  UpdateRoomCategoryDto,
} from './dto/room-category.dto.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiBearerAuth()
@ApiTags('Room Categories')
@Controller('room-categories')
export class RoomCategoriesController {
  constructor(private readonly roomCategoriesService: RoomCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List room categories' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.roomCategoriesService.findAll(
      organizationId,
      pagination,
      true,
      search,
    );
  }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get room category by ID' })
  // findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
  //   return this.roomCategoriesService.findOne(id, organizationId);
  // }
}
