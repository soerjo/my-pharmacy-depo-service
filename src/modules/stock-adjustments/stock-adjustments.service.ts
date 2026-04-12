import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StockMovementType } from '@prisma/client';
import { CreateStockAdjustmentDto } from './dto/index.js';

@Injectable()
export class StockAdjustmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStockAdjustmentDto, organizationId: string) {
    const [product, location] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.warehouseLocation.findUnique({
        where: { id: dto.locationId },
      }),
    ]);

    if (!product) {
      throw new NotFoundException(`Product with id ${dto.productId} not found`);
    }

    if (!location) {
      throw new NotFoundException(
        `WarehouseLocation with id ${dto.locationId} not found`,
      );
    }

    if (!dto.batchId) {
      throw new BadRequestException('batchId is required');
    }

    const batchId = dto.batchId;

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with id ${batchId} not found`);
    }

    const existingInventory = await this.prisma.batchInventory.findUnique({
      where: { batchId_locationId: { batchId, locationId: dto.locationId } },
    });

    const currentQty = existingInventory?.quantity ?? 0;

    if (currentQty + dto.quantity < 0) {
      throw new BadRequestException(
        'Adjustment would result in negative stock',
      );
    }

    const adjustmentNumber = `ADJ-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const batchInventory = await tx.batchInventory.upsert({
        where: { batchId_locationId: { batchId, locationId: dto.locationId } },
        create: {
          batchId,
          productId: dto.productId,
          locationId: dto.locationId,
          quantity: dto.quantity,
          organizationId,
        },
        update: { quantity: { increment: dto.quantity } },
      });

      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentNumber,
          quantity: dto.quantity,
          reason: dto.reason,
          productId: dto.productId,
          locationId: dto.locationId,
          batchId,
          organizationId,
        },
        include: {
          product: true,
          batch: true,
          location: true,
        },
      });

      await tx.stockMovement.create({
        data: {
          movementType: StockMovementType.ADJUSTMENT,
          quantity: dto.quantity,
          reason: dto.reason,
          productId: dto.productId,
          locationId: dto.locationId,
          batchId,
          referenceId: adjustment.id,
          organizationId,
        },
      });

      if (dto.quantity < 0 && batchInventory.quantity === 0) {
        const allInventory = await tx.batchInventory.findMany({
          where: { batchId },
        });

        const totalRemaining = allInventory.reduce(
          (sum, inv) => sum + inv.quantity,
          0,
        );

        if (totalRemaining === 0) {
          await tx.batch.update({
            where: { id: batchId },
            data: { isActive: false },
          });
        }
      }

      return adjustment;
    });
  }

  async findAll(
    organizationId: string,
    productId?: string,
    locationId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: Record<string, unknown> = { organizationId };

    if (productId) {
      where.productId = productId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (fromDate || toDate) {
      const adjustmentDate: Record<string, unknown> = {};

      if (fromDate) {
        adjustmentDate.gte = new Date(fromDate);
      }

      if (toDate) {
        adjustmentDate.lte = new Date(toDate);
      }

      where.adjustmentDate = adjustmentDate;
    }

    return this.prisma.stockAdjustment.findMany({
      where,
      include: {
        product: true,
        batch: true,
        location: true,
      },
      orderBy: { adjustmentDate: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        batch: true,
        location: true,
      },
    });

    if (!adjustment) {
      throw new NotFoundException(`StockAdjustment with id ${id} not found`);
    }

    return adjustment;
  }
}
