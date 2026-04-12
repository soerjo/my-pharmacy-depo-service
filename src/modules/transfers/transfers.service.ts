import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TransferStatus, StockMovementType } from '@prisma/client';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/index.js';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeAll = {
    product: true,
    batch: true,
    fromLocation: true,
    toLocation: true,
  };

  private readonly validTransitions: Record<TransferStatus, TransferStatus[]> =
    {
      PENDING: [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
      IN_TRANSIT: [TransferStatus.COMPLETED, TransferStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    };

  async create(organizationId: string, dto: CreateTransferDto) {
    const [product, batch, fromLocation, toLocation] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.batch.findUnique({ where: { id: dto.batchId } }),
      this.prisma.warehouseLocation.findUnique({
        where: { id: dto.fromLocationId },
      }),
      this.prisma.warehouseLocation.findUnique({
        where: { id: dto.toLocationId },
      }),
    ]);

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (!fromLocation) {
      throw new NotFoundException('From location not found');
    }
    if (!toLocation) {
      throw new NotFoundException('To location not found');
    }
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException(
        'From location and to location must be different',
      );
    }

    const batchInventory = await this.prisma.batchInventory.findUnique({
      where: {
        batchId_locationId: {
          batchId: dto.batchId,
          locationId: dto.fromLocationId,
        },
      },
    });

    if (!batchInventory || batchInventory.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock at source location');
    }

    const transferNumber = `TRF-${Date.now()}`;

    return this.prisma.transfer.create({
      data: {
        transferNumber,
        quantity: dto.quantity,
        status: TransferStatus.PENDING,
        notes: dto.notes,
        productId: dto.productId,
        batchId: dto.batchId,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        organizationId,
      },
      include: this.includeAll,
    });
  }

  async findAll(
    organizationId: string,
    status?: TransferStatus,
    productId?: string,
    fromLocationId?: string,
    toLocationId?: string,
  ) {
    return this.prisma.transfer.findMany({
      where: {
        organizationId,
        ...(status && { status }),
        ...(productId && { productId }),
        ...(fromLocationId && { fromLocationId }),
        ...(toLocationId && { toLocationId }),
      },
      include: this.includeAll,
      orderBy: { transferDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: this.includeAll,
    });

    if (!transfer || transfer.organizationId !== organizationId) {
      throw new NotFoundException('Transfer not found');
    }

    return transfer;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdateTransferStatusDto,
  ) {
    const transfer = await this.findOne(organizationId, id);

    const allowed = this.validTransitions[transfer.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid transition from ${transfer.status} to ${dto.status}`,
      );
    }

    if (dto.status === TransferStatus.COMPLETED) {
      return this.prisma.$transaction(async (tx) => {
        const fromInventory = await tx.batchInventory.findUnique({
          where: {
            batchId_locationId: {
              batchId: transfer.batchId,
              locationId: transfer.fromLocationId,
            },
          },
        });

        if (!fromInventory || fromInventory.quantity < transfer.quantity) {
          throw new BadRequestException(
            'Insufficient stock at source location',
          );
        }

        await tx.batchInventory.update({
          where: {
            batchId_locationId: {
              batchId: transfer.batchId,
              locationId: transfer.fromLocationId,
            },
          },
          data: { quantity: { increment: -transfer.quantity } },
        });

        await tx.batchInventory.upsert({
          where: {
            batchId_locationId: {
              batchId: transfer.batchId,
              locationId: transfer.toLocationId,
            },
          },
          create: {
            batchId: transfer.batchId,
            productId: transfer.productId,
            locationId: transfer.toLocationId,
            quantity: transfer.quantity,
            organizationId,
          },
          update: {
            quantity: { increment: transfer.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            movementType: StockMovementType.TRANSFER_OUT,
            quantity: transfer.quantity,
            batchId: transfer.batchId,
            productId: transfer.productId,
            locationId: transfer.fromLocationId,
            referenceId: transfer.id,
            organizationId,
          },
        });

        await tx.stockMovement.create({
          data: {
            movementType: StockMovementType.TRANSFER_IN,
            quantity: transfer.quantity,
            batchId: transfer.batchId,
            productId: transfer.productId,
            locationId: transfer.toLocationId,
            referenceId: transfer.id,
            organizationId,
          },
        });

        return tx.transfer.update({
          where: { id },
          data: { status: TransferStatus.COMPLETED },
          include: this.includeAll,
        });
      });
    }

    return this.prisma.transfer.update({
      where: { id },
      data: { status: dto.status },
      include: this.includeAll,
    });
  }
}
