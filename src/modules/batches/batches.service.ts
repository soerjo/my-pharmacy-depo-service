import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateBatchDto, UpdateBatchDto } from './dto/index.js';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBatchDto, organizationId: string) {
    const [product, manufacturer] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.manufacturer.findUnique({
        where: { id: dto.manufacturerId },
      }),
    ]);

    if (!product) {
      throw new NotFoundException(`Product with id ${dto.productId} not found`);
    }

    if (!manufacturer) {
      throw new NotFoundException(
        `Manufacturer with id ${dto.manufacturerId} not found`,
      );
    }

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(
          `Supplier with id ${dto.supplierId} not found`,
        );
      }
    }

    if (dto.compoundingBatchId) {
      const compoundingBatch = await this.prisma.compoundingBatch.findUnique({
        where: { id: dto.compoundingBatchId },
      });
      if (!compoundingBatch) {
        throw new NotFoundException(
          `CompoundingBatch with id ${dto.compoundingBatchId} not found`,
        );
      }
    }

    try {
      return await this.prisma.batch.create({
        data: {
          batchNumber: dto.batchNumber,
          expirationDate: new Date(dto.expirationDate),
          manufacturingDate: dto.manufacturingDate
            ? new Date(dto.manufacturingDate)
            : undefined,
          receivedDate: dto.receivedDate
            ? new Date(dto.receivedDate)
            : undefined,
          cost: dto.cost,
          productId: dto.productId,
          manufacturerId: dto.manufacturerId,
          supplierId: dto.supplierId,
          compoundingBatchId: dto.compoundingBatchId,
          organizationId,
        },
        include: {
          product: true,
          manufacturer: true,
          supplier: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        throw new ConflictException(
          `Batch number "${dto.batchNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(organizationId: string, productId?: string, isActive?: string) {
    const where: Record<string, unknown> = { organizationId };

    if (productId) {
      where.productId = productId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    return this.prisma.batch.findMany({
      where,
      include: {
        product: true,
        manufacturer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const batch = await this.prisma.batch.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        manufacturer: true,
        supplier: true,
        batchInventory: {
          include: {
            location: { select: { name: true } },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with id ${id} not found`);
    }

    return batch;
  }

  async update(id: string, organizationId: string, dto: UpdateBatchDto) {
    const existing = await this.prisma.batch.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Batch with id ${id} not found`);
    }

    const data: Record<string, unknown> = {};

    if (dto.expirationDate !== undefined) {
      data.expirationDate = new Date(dto.expirationDate);
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.batch.update({
      where: { id },
      data,
      include: {
        product: true,
        manufacturer: true,
        supplier: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.batch.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Batch with id ${id} not found`);
    }

    return this.prisma.batch.update({
      where: { id },
      data: { isActive: false },
      include: {
        product: true,
        manufacturer: true,
      },
    });
  }

  async getBatchBreakdown(productId: string, organizationId: string) {
    return this.prisma.batchInventory.findMany({
      where: {
        productId,
        batch: { isActive: true, organizationId },
        quantity: { gt: 0 },
      },
      include: {
        batch: {
          select: { batchNumber: true, expirationDate: true, cost: true },
        },
        location: { select: { name: true } },
      },
      orderBy: { batch: { expirationDate: 'asc' } },
    });
  }
}
