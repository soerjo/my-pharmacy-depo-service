import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/index.js';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto, organizationId: string) {
    return this.prisma.supplier.create({
      data: { ...dto, organizationId },
    });
  }

  async findAll(isActive?: string, organizationId?: string) {
    const where: Record<string, unknown> = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    return this.prisma.supplier.findMany({ where });
  }

  async findOne(id: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
