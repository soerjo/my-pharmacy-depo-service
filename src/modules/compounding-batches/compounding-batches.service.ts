import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompoundingStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateCompoundingBatchDto,
  UpdateCompoundingStatusDto,
} from './dto/index.js';

@Injectable()
export class CompoundingBatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateCompoundingBatchDto) {
    const formula = await this.prisma.formula.findUnique({
      where: { id: dto.formulaId },
      include: {
        product: true,
        ingredients: true,
      },
    });

    if (!formula || formula.organizationId !== organizationId) {
      throw new NotFoundException('Formula not found');
    }

    const location = await this.prisma.warehouseLocation.findUnique({
      where: { id: dto.locationId },
    });

    if (!location || location.organizationId !== organizationId) {
      throw new NotFoundException('Location not found');
    }

    for (const mat of dto.materials) {
      const product = await this.prisma.product.findUnique({
        where: { id: mat.productId },
      });

      if (!product || product.organizationId !== organizationId) {
        throw new NotFoundException(`Product ${mat.productId} not found`);
      }

      const batch = await this.prisma.batch.findUnique({
        where: { id: mat.batchId },
      });

      if (!batch || batch.organizationId !== organizationId) {
        throw new NotFoundException(`Batch ${mat.batchId} not found`);
      }

      if (batch.productId !== mat.productId) {
        throw new BadRequestException(
          `Batch ${mat.batchId} does not belong to product ${mat.productId}`,
        );
      }

      const matLocation = await this.prisma.warehouseLocation.findUnique({
        where: { id: mat.locationId },
      });

      if (!matLocation || matLocation.organizationId !== organizationId) {
        throw new NotFoundException(`Location ${mat.locationId} not found`);
      }

      const inventory = await this.prisma.batchInventory.findUnique({
        where: {
          batchId_locationId: {
            batchId: mat.batchId,
            locationId: mat.locationId,
          },
        },
      });

      const requiredQty = Math.round(Number(mat.quantityUsed));

      if (!inventory || inventory.quantity < requiredQty) {
        throw new BadRequestException(
          `Insufficient stock for batch ${mat.batchId} at location ${mat.locationId}. Required: ${requiredQty}, Available: ${inventory?.quantity ?? 0}`,
        );
      }
    }

    const batchNumber = `CMP-${Date.now()}`;

    return this.prisma.compoundingBatch.create({
      data: {
        batchNumber,
        expirationDate: new Date(dto.expirationDate),
        quantity: dto.quantity,
        notes: dto.notes,
        formulaId: dto.formulaId,
        locationId: dto.locationId,
        status: 'PENDING',
        organizationId,
        materials: {
          create: dto.materials.map((mat) => ({
            productId: mat.productId,
            batchId: mat.batchId,
            locationId: mat.locationId,
            quantityUsed: mat.quantityUsed,
          })),
        },
      },
      include: {
        formula: {
          include: {
            product: true,
            ingredients: true,
          },
        },
        location: true,
        materials: {
          include: {
            product: true,
            batch: true,
            location: true,
          },
        },
      },
    });
  }

  async findAll(organizationId: string, status?: string, formulaId?: string) {
    const where: Prisma.CompoundingBatchWhereInput = { organizationId };

    if (status) {
      where.status = status as CompoundingStatus;
    }

    if (formulaId) {
      where.formulaId = formulaId;
    }

    return this.prisma.compoundingBatch.findMany({
      where,
      include: {
        formula: {
          include: {
            product: true,
          },
        },
        location: true,
        materials: {
          include: {
            product: true,
            batch: true,
            location: true,
          },
        },
        producedBatch: true,
      },
      orderBy: { producedDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const compoundingBatch = await this.prisma.compoundingBatch.findUnique({
      where: { id },
      include: {
        formula: {
          include: {
            product: true,
            ingredients: true,
          },
        },
        location: true,
        materials: {
          include: {
            product: true,
            batch: true,
            location: true,
          },
        },
        producedBatch: true,
      },
    });

    if (
      !compoundingBatch ||
      compoundingBatch.organizationId !== organizationId
    ) {
      throw new NotFoundException('Compounding batch not found');
    }

    return compoundingBatch;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdateCompoundingStatusDto,
  ) {
    const compoundingBatch = await this.findOne(organizationId, id);

    this.validateTransition(compoundingBatch.status, dto.status);

    if (dto.status === 'COMPLETED' || dto.status === 'FAILED') {
      const batchWithMaterials = await this.prisma.compoundingBatch.findUnique({
        where: { id },
        include: {
          formula: {
            include: {
              product: true,
            },
          },
          materials: true,
        },
      });

      if (!batchWithMaterials) {
        throw new NotFoundException('Compounding batch not found');
      }

      await this.prisma.$transaction(async (tx) => {
        for (const mat of batchWithMaterials.materials) {
          const qtyToDeduct = Math.round(Number(mat.quantityUsed));

          const inventory = await tx.batchInventory.findUnique({
            where: {
              batchId_locationId: {
                batchId: mat.batchId,
                locationId: mat.locationId,
              },
            },
          });

          if (inventory) {
            await tx.batchInventory.update({
              where: { id: inventory.id },
              data: { quantity: { decrement: qtyToDeduct } },
            });
          }

          await tx.stockMovement.create({
            data: {
              movementType: StockMovementType.COMPOUNDING_OUT,
              quantity: qtyToDeduct,
              productId: mat.productId,
              locationId: mat.locationId,
              batchId: mat.batchId,
              referenceId: id,
              organizationId,
            },
          });
        }

        if (dto.status === 'COMPLETED') {
          const outputProduct = batchWithMaterials.formula.product;
          const newBatch = await tx.batch.create({
            data: {
              batchNumber: batchWithMaterials.batchNumber,
              expirationDate: batchWithMaterials.expirationDate,
              cost: 0,
              productId: outputProduct.id,
              manufacturerId: outputProduct.manufacturerId,
              organizationId,
            },
          });

          await tx.batch.update({
            where: { id: newBatch.id },
            data: {
              compoundingBatchId: id,
            },
          });

          await tx.batchInventory.create({
            data: {
              batchId: newBatch.id,
              productId: outputProduct.id,
              locationId: batchWithMaterials.locationId,
              quantity: batchWithMaterials.quantity,
              organizationId,
            },
          });

          await tx.stockMovement.create({
            data: {
              movementType: StockMovementType.COMPOUNDING_IN,
              quantity: batchWithMaterials.quantity,
              productId: outputProduct.id,
              locationId: batchWithMaterials.locationId,
              batchId: newBatch.id,
              referenceId: id,
              organizationId,
            },
          });
        }
      });
    }

    await this.prisma.compoundingBatch.update({
      where: { id },
      data: { status: dto.status },
    });

    return this.findOne(organizationId, id);
  }

  private validateTransition(
    current: CompoundingStatus,
    next: CompoundingStatus,
  ) {
    const validTransitions: Record<CompoundingStatus, CompoundingStatus[]> = {
      PENDING: ['MIXING', 'CANCELLED'],
      MIXING: ['QC_CHECK', 'CANCELLED'],
      QC_CHECK: ['COMPLETED', 'FAILED'],
      COMPLETED: [],
      CANCELLED: [],
      FAILED: [],
    };

    const allowed = validTransitions[current];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }
}
