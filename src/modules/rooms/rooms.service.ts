import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomsService {
  private includeRelations = {
    category: true,
    // class: true,
    // beds: true,
  } as const;

  constructor(private prisma: PrismaService) {}

  private async validateCategory(categoryId: string, orgId: string) {
    const category = await this.prisma.roomCategory.findFirst({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Room category with id ${categoryId} not found`,
      );
    }
    return category;
  }

  // private async validateClass(classId: string, orgId: string) {
  //   const roomClass = await this.prisma.roomClass.findFirst({
  //     where: { id: classId, orgId },
  //   });
  //   if (!roomClass) {
  //     throw new NotFoundException(`Room class with id ${classId} not found`);
  //   }
  //   return roomClass;
  // }

  private async generateNextCode(
    name: string,
    organizationId: string,
  ): Promise<string> {
    const prefix = `RM-${name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 10)}`;

    const rooms = await this.prisma.room.findMany({
      where: { orgId: organizationId, code: { startsWith: `${prefix}-` } },
      select: { code: true },
    });

    let maxNumber = 0;
    for (const room of rooms) {
      const suffix = room.code.slice(prefix.length + 1);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    return `${prefix}-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateRoomDto, organizationId: string) {
    await this.validateCategory(dto.categoryId, organizationId);
    // await this.validateClass(dto.classId, organizationId);

    const code =
      dto.code?.trim() ||
      (await this.generateNextCode(dto.name, organizationId));

    const existing = await this.prisma.room.findUnique({
      where: { orgId_code: { orgId: organizationId, code } },
    });
    if (existing) {
      throw new ConflictException(`Room with code "${code}" already exists`);
    }

    return this.prisma.room.create({
      data: {
        orgId: organizationId,
        categoryId: dto.categoryId,
        // classId: dto.classId,
        code,
        name: dto.name,
        // floor: dto.floor,
        active: true,
      },
      include: this.includeRelations,
    });
  }

  async findAll(
    organizationId: string,
    pagination: PaginationDto,
    isActive?: boolean,
    categoryId?: string,
    search?: string,
  ): Promise<PaginatedResponseDto<unknown>> {
    const orgFilter: Prisma.RoomWhereInput = {
      OR: [{ orgId: { equals: null } }, { orgId: { equals: organizationId } }],
    };

    const searchFilter: Prisma.RoomWhereInput | null = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : null;

    const where: Prisma.RoomWhereInput = {
      AND: [
        orgFilter,
        ...(searchFilter ? [searchFilter] : []),
        ...(isActive !== undefined ? [{ active: isActive }] : []),
        ...(categoryId ? [{ categoryId }] : []),
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        include: this.includeRelations,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.room.count({ where }),
    ]);

    const mappingData = data.map((item) => {
      const { category, ...rest } = item;
      return {
        ...rest,
        categoryId: category.id,
        categoryName: category.name,
      };
    });

    return PaginatedResponseDto.create(mappingData, total, pagination);
  }

  async findOne(id: string, organizationId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id },
      include: this.includeRelations,
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return room;
  }

  async update(id: string, dto: UpdateRoomDto, organizationId: string) {
    await this.findOne(id, organizationId);

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId, organizationId);
    }
    // if (dto.classId) {
    //   await this.validateClass(dto.classId, organizationId);
    // }

    if (dto.code) {
      const existing = await this.prisma.room.findUnique({
        where: { orgId_code: { orgId: organizationId, code: dto.code } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Room with code "${dto.code}" already exists`,
        );
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        // ...(dto.classId !== undefined && { classId: dto.classId }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        // ...(dto.floor !== undefined && { floor: dto.floor }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: this.includeRelations,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.room.update({
      where: { id },
      data: { active: false },
    });
  }
}
