import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateLocationDto, UpdateLocationDto } from './dto/index.js';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLocationDto, organizationId: string) {
    const existing = await this.prisma.location.findUnique({
      where: { orgId_code: { orgId: organizationId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(
        `Location with code ${dto.code} already exists`,
      );
    }

    if (dto.parentId) {
      const parent = await this.prisma.location.findFirst({
        where: { id: dto.parentId, orgId: organizationId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent location with id ${dto.parentId} not found`,
        );
      }
    }

    return this.prisma.location.create({
      data: {
        orgId: organizationId,
        name: dto.name,
        code: dto.code,
        type: dto.type,
        parentId: dto.parentId,
        active: dto.active,
      },
      include: { parent: true, children: true },
    });
  }

  async findAll(organizationId: string, type?: string, isActive?: boolean) {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.active = isActive;
    }

    return this.prisma.location.findMany({
      where,
      include: { parent: true, children: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, orgId: organizationId },
      include: { parent: true, children: true },
    });

    if (!location) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }

    return location;
  }

  async update(id: string, dto: UpdateLocationDto, organizationId: string) {
    await this.findOne(id, organizationId);

    if (dto.parentId) {
      const parent = await this.prisma.location.findFirst({
        where: { id: dto.parentId, orgId: organizationId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent location with id ${dto.parentId} not found`,
        );
      }
    }

    return this.prisma.location.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: { parent: true, children: true },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.location.update({
      where: { id },
      data: { active: false },
    });
  }
}
