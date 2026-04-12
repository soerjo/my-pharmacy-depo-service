import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PurchaseOrderStatus } from '@prisma/client';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/index.js';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly validTransitions: Record<
    PurchaseOrderStatus,
    PurchaseOrderStatus[]
  > = {
    DRAFT: ['SENT', 'CANCELLED'],
    SENT: ['CONFIRMED'],
    CONFIRMED: ['PARTIALLY_RECEIVED', 'CANCELLED'],
    PARTIALLY_RECEIVED: ['RECEIVED'],
    RECEIVED: [],
    CANCELLED: [],
  };

  async create(organizationId: string, dto: CreatePurchaseOrderDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Products not found: ${missingIds.join(', ')}`,
      );
    }

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const orderNumber = `PO-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          expectedDate: dto.expectedDate
            ? new Date(dto.expectedDate)
            : undefined,
          totalAmount,
          notes: dto.notes,
          supplierId: dto.supplierId,
          organizationId,
          items: {
            create: dto.items.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              productId: item.productId,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      return purchaseOrder;
    });
  }

  async findAll(
    organizationId: string,
    status?: PurchaseOrderStatus,
    supplierId?: string,
    from?: string,
    to?: string,
  ) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        ...(status && { status }),
        ...(supplierId && { supplierId }),
        ...((from || to) && {
          orderDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      include: {
        items: { include: { product: true } },
        supplier: true,
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        supplier: true,
        inboundShipments: true,
      },
    });

    if (!purchaseOrder || purchaseOrder.organizationId !== organizationId) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
  ) {
    const purchaseOrder = await this.findOne(organizationId, id);

    const allowed = this.validTransitions[purchaseOrder.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid transition from ${purchaseOrder.status} to ${dto.status}`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { include: { product: true } },
        supplier: true,
      },
    });
  }

  async cancel(organizationId: string, id: string) {
    const purchaseOrder = await this.findOne(organizationId, id);

    if (
      purchaseOrder.status !== PurchaseOrderStatus.DRAFT &&
      purchaseOrder.status !== PurchaseOrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot cancel purchase order with status ${purchaseOrder.status}`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: {
        items: { include: { product: true } },
        supplier: true,
      },
    });
  }
}
