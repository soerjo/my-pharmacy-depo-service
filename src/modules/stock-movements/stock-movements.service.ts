import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    movementType?: StockMovementType,
    productId?: string,
    locationId?: string,
    batchId?: string,
    referenceId?: string,
    fromDate?: string,
    toDate?: string,
    page = 1,
    pageSize = 20,
  ) {
    const where: Prisma.StockMovementWhereInput = { organizationId };

    if (movementType) {
      where.movementType = movementType;
    }

    if (productId) {
      where.productId = productId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (batchId) {
      where.batchId = batchId;
    }

    if (referenceId) {
      where.referenceId = referenceId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        (where.createdAt as Prisma.DateTimeNullableFilter).gte = new Date(
          fromDate,
        );
      }
      if (toDate) {
        (where.createdAt as Prisma.DateTimeNullableFilter).lte = new Date(
          toDate,
        );
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: true,
          location: true,
          batch: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        location: true,
        batch: true,
      },
    });

    if (!movement || movement.organizationId !== organizationId) {
      throw new NotFoundException('Stock movement not found');
    }

    return movement;
  }

  async getByReference(organizationId: string, referenceId: string) {
    return this.prisma.stockMovement.findMany({
      where: { referenceId, organizationId },
      include: {
        product: true,
        location: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
