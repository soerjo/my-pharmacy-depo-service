import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateRoomCategoryDto,
  UpdateRoomCategoryDto,
} from './dto/room-category.dto.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    pagination: PaginationDto,
    isActive?: boolean,
    search?: string,
  ): Promise<PaginatedResponseDto<unknown>> {

    const where: Prisma.RoomCategoryWhereInput = {
      active: isActive,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    }

    const [data, total] = await Promise.all([
      this.prisma.roomCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.roomCategory.count({
        where,
      }),
    ]);

    return PaginatedResponseDto.create(data, total, pagination);
  }

  async findOne(id: string, organizationId: string) {
    const category = await this.prisma.roomCategory.findFirst({
      where: { id},
    });

    if (!category) {
      throw new NotFoundException(`Room category with id ${id} not found`);
    }

    return category;
  }
}
