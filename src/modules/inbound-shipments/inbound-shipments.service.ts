import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InboundShipmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateInboundShipmentDto,
  UpdateInboundStatusDto,
} from './dto/index.js';

@Injectable()
export class InboundShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateInboundShipmentDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, organizationId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    if (dto.purchaseOrderId) {
      const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.purchaseOrderId, organizationId },
      });

      if (!purchaseOrder) {
        throw new NotFoundException('Purchase order not found');
      }
    }

    const shipmentNumber = `IN-${Date.now()}`;

    return this.prisma.inboundShipment.create({
      data: {
        shipmentNumber,
        receivedBy: dto.receivedBy,
        notes: dto.notes,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        organizationId,
        status: 'PENDING',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            batchId: item.batchId,
            quantity: item.quantity,
            locationId: item.locationId,
          })),
        },
      },
      include: {
        items: {
          include: {
            batch: true,
            product: true,
            location: true,
          },
        },
        supplier: true,
      },
    });
  }

  async findAll(
    organizationId: string,
    status?: string,
    supplierId?: string,
    from?: string,
    to?: string,
  ) {
    const where: Prisma.InboundShipmentWhereInput = { organizationId };

    if (status) {
      where.status = status as InboundShipmentStatus;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (from || to) {
      where.receivedDate = {};
      if (from) {
        (where.receivedDate as Prisma.DateTimeNullableFilter).gte = new Date(
          from,
        );
      }
      if (to) {
        (where.receivedDate as Prisma.DateTimeNullableFilter).lte = new Date(
          to,
        );
      }
    }

    return this.prisma.inboundShipment.findMany({
      where,
      include: {
        items: {
          include: {
            batch: true,
            product: true,
            location: true,
          },
        },
        supplier: true,
      },
      orderBy: { receivedDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const shipment = await this.prisma.inboundShipment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            batch: true,
            product: true,
            location: true,
          },
        },
        supplier: true,
        purchaseOrder: true,
      },
    });

    if (!shipment || shipment.organizationId !== organizationId) {
      throw new NotFoundException('Inbound shipment not found');
    }

    return shipment;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdateInboundStatusDto,
  ) {
    const shipment = await this.findOne(organizationId, id);

    this.validateTransition(shipment.status, dto.status);

    const updated = await this.prisma.inboundShipment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: {
          include: {
            batch: true,
            product: true,
            location: true,
          },
        },
        supplier: true,
        purchaseOrder: true,
      },
    });

    if (dto.status === 'COMPLETED') {
      await this.completeShipment(updated, organizationId);
    }

    return this.findOne(organizationId, id);
  }

  private validateTransition(
    current: InboundShipmentStatus,
    next: InboundShipmentStatus,
  ) {
    const validTransitions: Record<
      InboundShipmentStatus,
      InboundShipmentStatus[]
    > = {
      PENDING: ['RECEIVING', 'CANCELLED'],
      RECEIVING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[current];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }

  private async completeShipment(
    shipment: {
      id: string;
      purchaseOrderId: string | null;
      items: Array<{
        batchId: string;
        productId: string;
        locationId: string;
        quantity: number;
      }>;
    },
    organizationId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of shipment.items) {
        await tx.batch.findFirst({
          where: { id: item.batchId, productId: item.productId },
        });

        const existing = await tx.batchInventory.findUnique({
          where: {
            batchId_locationId: {
              batchId: item.batchId,
              locationId: item.locationId,
            },
          },
        });

        if (existing) {
          await tx.batchInventory.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.batchInventory.create({
            data: {
              batchId: item.batchId,
              productId: item.productId,
              locationId: item.locationId,
              quantity: item.quantity,
              organizationId,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            movementType: 'INBOUND',
            quantity: item.quantity,
            productId: item.productId,
            locationId: item.locationId,
            batchId: item.batchId,
            referenceId: shipment.id,
            organizationId,
          },
        });
      }

      if (shipment.purchaseOrderId) {
        for (const item of shipment.items) {
          await tx.purchaseOrderItem.updateMany({
            where: {
              purchaseOrderId: shipment.purchaseOrderId,
              productId: item.productId,
            },
            data: { receivedQty: { increment: item.quantity } },
          });
        }

        const poItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: shipment.purchaseOrderId },
        });

        const allReceived = poItems.every(
          (poItem) => poItem.receivedQty >= poItem.quantity,
        );
        const someReceived = poItems.some((poItem) => poItem.receivedQty > 0);

        if (allReceived) {
          await tx.purchaseOrder.update({
            where: { id: shipment.purchaseOrderId },
            data: { status: 'RECEIVED' },
          });
        } else if (someReceived) {
          await tx.purchaseOrder.update({
            where: { id: shipment.purchaseOrderId },
            data: { status: 'PARTIALLY_RECEIVED' },
          });
        }
      }
    });
  }
}
