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
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiBearerAuth()
@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create room' })
  create(@Body() dto: CreateRoomDto, @OrganizationId() organizationId: string) {
    return this.roomsService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List rooms' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query() pagination: PaginationDto,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.roomsService.findAll(
      organizationId,
      pagination,
      true,
      categoryId,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.roomsService.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update room' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.roomsService.update(id, dto, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate room' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.roomsService.remove(id, organizationId);
  }
}
