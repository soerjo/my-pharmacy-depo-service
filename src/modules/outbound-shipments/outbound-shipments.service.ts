import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OutboundShipmentStatus, StockMovementType } from '@prisma/client';
import {
  CreateOutboundShipmentDto,
  UpdateOutboundStatusDto,
} from './dto/index.js';

@Injectable()
export class OutboundShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly validTransitions: Record<
    OutboundShipmentStatus,
    OutboundShipmentStatus[]
  > = {
    PENDING: [OutboundShipmentStatus.PICKING, OutboundShipmentStatus.CANCELLED],
    PICKING: [OutboundShipmentStatus.PACKED, OutboundShipmentStatus.CANCELLED],
    PACKED: [OutboundShipmentStatus.SHIPPED, OutboundShipmentStatus.CANCELLED],
    SHIPPED: [OutboundShipmentStatus.DELIVERED],
    DELIVERED: [],
    CANCELLED: [],
  };

  async create(organizationId: string, dto: CreateOutboundShipmentDto) {
    const batchIds = dto.items.map((item) => item.batchId);
    const productIds = dto.items.map((item) => item.productId);
    const locationIds = dto.items.map((item) => item.locationId);

    const [batches, products, locations] = await Promise.all([
      this.prisma.batch.findMany({ where: { id: { in: batchIds } } }),
      this.prisma.product.findMany({ where: { id: { in: productIds } } }),
      this.prisma.warehouseLocation.findMany({
        where: { id: { in: locationIds } },
      }),
    ]);

    const foundBatchIds = new Set(batches.map((b) => b.id));
    const missingBatchIds = batchIds.filter((id) => !foundBatchIds.has(id));
    if (missingBatchIds.length > 0) {
      throw new NotFoundException(
        `Batches not found: ${missingBatchIds.join(', ')}`,
      );
    }

    const foundProductIds = new Set(products.map((p) => p.id));
    const missingProductIds = productIds.filter(
      (id) => !foundProductIds.has(id),
    );
    if (missingProductIds.length > 0) {
      throw new NotFoundException(
        `Products not found: ${missingProductIds.join(', ')}`,
      );
    }

    const foundLocationIds = new Set(locations.map((l) => l.id));
    const missingLocationIds = locationIds.filter(
      (id) => !foundLocationIds.has(id),
    );
    if (missingLocationIds.length > 0) {
      throw new NotFoundException(
        `Locations not found: ${missingLocationIds.join(', ')}`,
      );
    }

    for (const item of dto.items) {
      const inventory = await this.prisma.batchInventory.findUnique({
        where: {
          batchId_locationId: {
            batchId: item.batchId,
            locationId: item.locationId,
          },
        },
      });

      if (!inventory || inventory.quantity < item.quantity) {
        const available = inventory?.quantity ?? 0;
        throw new BadRequestException(
          `Insufficient stock for batch ${item.batchId} at location ${item.locationId}. Available: ${available}, Requested: ${item.quantity}`,
        );
      }
    }

    const shipmentNumber = `OUT-${Date.now()}`;

    return this.prisma.outboundShipment.create({
      data: {
        shipmentNumber,
        destination: dto.destination,
        destinationAddress: dto.destinationAddress,
        notes: dto.notes,
        organizationId,
        status: OutboundShipmentStatus.PENDING,
        items: {
          create: dto.items.map((item) => ({
            quantity: item.quantity,
            batchId: item.batchId,
            productId: item.productId,
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
      },
    });
  }

  async findAll(
    organizationId: string,
    status?: OutboundShipmentStatus,
    from?: string,
    to?: string,
  ) {
    return this.prisma.outboundShipment.findMany({
      where: {
        organizationId,
        ...(status && { status }),
        ...((from || to) && {
          shipmentDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      include: {
        items: {
          include: {
            batch: true,
            product: true,
            location: true,
          },
        },
      },
      orderBy: { shipmentDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const shipment = await this.prisma.outboundShipment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            batch: true,
            product: true,
            location: true,
          },
        },
      },
    });

    if (!shipment || shipment.organizationId !== organizationId) {
      throw new NotFoundException('Outbound shipment not found');
    }

    return shipment;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdateOutboundStatusDto,
  ) {
    const shipment = await this.findOne(organizationId, id);

    const allowed = this.validTransitions[shipment.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid transition from ${shipment.status} to ${dto.status}`,
      );
    }

    if (dto.status === OutboundShipmentStatus.SHIPPED) {
      return this.prisma.$transaction(async (tx) => {
        for (const item of shipment.items) {
          const inventory = await tx.batchInventory.findUnique({
            where: {
              batchId_locationId: {
                batchId: item.batchId,
                locationId: item.locationId,
              },
            },
          });

          if (!inventory || inventory.quantity < item.quantity) {
            const available = inventory?.quantity ?? 0;
            throw new BadRequestException(
              `Insufficient stock for batch ${item.batchId} at location ${item.locationId}. Available: ${available}, Required: ${item.quantity}`,
            );
          }

          await tx.batchInventory.update({
            where: {
              batchId_locationId: {
                batchId: item.batchId,
                locationId: item.locationId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }

        for (const item of shipment.items) {
          await tx.stockMovement.create({
            data: {
              movementType: StockMovementType.OUTBOUND,
              quantity: item.quantity,
              productId: item.productId,
              batchId: item.batchId,
              locationId: item.locationId,
              organizationId,
              referenceId: shipment.id,
            },
          });
        }

        return tx.outboundShipment.update({
          where: { id },
          data: { status: OutboundShipmentStatus.SHIPPED },
          include: {
            items: {
              include: {
                batch: true,
                product: true,
                location: true,
              },
            },
          },
        });
      });
    }

    return this.prisma.outboundShipment.update({
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
      },
    });
  }

  async suggestFifoBatch(
    organizationId: string,
    productId: string,
    locationId: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    const location = await this.prisma.warehouseLocation.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location not found: ${locationId}`);
    }

    const inventory = await this.prisma.batchInventory.findFirst({
      where: {
        productId,
        locationId,
        organizationId,
        quantity: { gt: 0 },
      },
      orderBy: {
        batch: { expirationDate: 'asc' },
      },
      include: {
        batch: true,
        product: true,
        location: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        `No available stock for product ${productId} at location ${locationId}`,
      );
    }

    return {
      batchId: inventory.batch.id,
      batchNumber: inventory.batch.batchNumber,
      expirationDate: inventory.batch.expirationDate,
      availableQuantity: inventory.quantity,
      productId: inventory.product.id,
      productName: inventory.product.name,
      locationId: inventory.location.id,
      locationName: inventory.location.name,
    };
  }
}
