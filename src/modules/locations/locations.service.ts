import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateLocationDto, UpdateLocationDto } from './dto/index.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class LocationsService {
  private includeRelations = {
    parent: true,
    children: true,
  } as const;

  constructor(private prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20);
  }

  private async generateNextCode(
    dto: CreateLocationDto,
    organizationId: string,
  ): Promise<string> {
    const prefix = `LOC-${dto.type}-${this.slugify(dto.name)}`;

    const locations = await this.prisma.location.findMany({
      where: { orgId: organizationId, code: { startsWith: `${prefix}-` } },
      select: { code: true },
    });

    let maxNumber = 0;
    for (const loc of locations) {
      const suffix = loc.code.slice(prefix.length + 1);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    return `${prefix}-${String(maxNumber + 1).padStart(6, '0')}`;
  }

  private async validateParent(
    parentId: string | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!parentId) return;

    const parent = await this.prisma.location.findFirst({
      where: { id: parentId, orgId: organizationId },
    });
    if (!parent) {
      throw new NotFoundException(
        `Parent location with id ${parentId} not found`,
      );
    }
  }

  async create(dto: CreateLocationDto, organizationId: string) {
    const code =
      dto.code?.trim() || (await this.generateNextCode(dto, organizationId));

    const existing = await this.prisma.location.findUnique({
      where: { orgId_code: { orgId: organizationId, code } },
    });
    if (existing) {
      throw new ConflictException(`Location with code ${code} already exists`);
    }

    await this.validateParent(dto.parentId, organizationId);

    return this.prisma.location.create({
      data: {
        orgId: organizationId,
        name: dto.name,
        code,
        type: dto.type,
        parentId: dto.parentId,
        active: dto.active,
      },
      include: this.includeRelations,
    });
  }

  async findAll(
    organizationId: string,
    pagination: PaginationDto,
    type?: string,
    isActive?: boolean,
  ): Promise<PaginatedResponseDto<unknown>> {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.active = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        include: this.includeRelations,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.location.count({ where }),
    ]);

    return PaginatedResponseDto.create(data, total, pagination);
  }

  async findOne(id: string, organizationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, orgId: organizationId },
      include: this.includeRelations,
    });

    if (!location) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }

    return location;
  }

  async update(id: string, dto: UpdateLocationDto, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.validateParent(dto.parentId, organizationId);

    return this.prisma.location.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: this.includeRelations,
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
