import { PrismaService } from '../../prisma/prisma.service.js';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto } from './dto/index.js';

@Injectable()
export class UnitOfMeasuresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUnitOfMeasureDto, organizationId: string) {
    if (dto.baseUnitId) {
      const base = await this.prisma.unitOfMeasure.findFirst({
        where: { id: dto.baseUnitId, organizationId },
      });
      if (!base) throw new NotFoundException('Base unit not found');
    }

    return this.prisma.unitOfMeasure.create({
      data: {
        code: dto.code,
        name: dto.name,
        abbreviation: dto.abbreviation,
        isBase: dto.isBase ?? !dto.baseUnitId,
        baseUnitId: dto.baseUnitId,
        conversionFactor: dto.conversionFactor
          ? dto.conversionFactor
          : undefined,
        organizationId,
      },
      include: { baseUnit: true, derivedUnits: true },
    });
  }

  async findAll(organizationId: string, isActive?: boolean) {
    return this.prisma.unitOfMeasure.findMany({
      where: { organizationId, ...(isActive !== undefined && { isActive }) },
      include: { baseUnit: true, derivedUnits: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const uom = await this.prisma.unitOfMeasure.findFirst({
      where: { id, organizationId },
      include: { baseUnit: true, derivedUnits: true },
    });
    if (!uom) throw new NotFoundException('Unit of measure not found');
    return uom;
  }

  async update(
    id: string,
    dto: UpdateUnitOfMeasureDto,
    organizationId: string,
  ) {
    await this.findOne(id, organizationId);
    return this.prisma.unitOfMeasure.update({
      where: { id },
      data: dto,
      include: { baseUnit: true, derivedUnits: true },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    const inUse = await this.prisma.product.findFirst({
      where: {
        organizationId,
        OR: [
          { baseUnitId: id },
          { stockingUnitId: id },
          { sellingUnitId: id },
          { purchaseUnitId: id },
        ],
      },
    });
    if (inUse)
      throw new ConflictException('Unit of measure is in use by products');
    return this.prisma.unitOfMeasure.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
