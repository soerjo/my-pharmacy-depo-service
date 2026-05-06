import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateDispenseOrderDto,
  UpdateDispenseOrderDto,
  AddDispenseOrderItemDto,
  UpdateDispenseOrderItemDto,
  CancelDispenseOrderDto,
  DispenseOrderQueryDto,
} from './dto/index.js';
import {
  DispenseOrder,
  DispenseOrderStatus,
  Prisma,
} from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto.js';
import { WarehouseService } from '../warehouse/warehouse.service.js';
import { IGetDispenseOrderResponse } from './dispense-orders.interface.js';

@Injectable()
export class DispenseOrdersService {
  constructor(
    private prisma: PrismaService,
    private warehouseService: WarehouseService,
  ) {}

  private async generateOrderNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `DSP-${dateStr}-`;

    const lastOrder = await this.prisma.dispenseOrder.findFirst({
      where: {
        orgId: organizationId,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.slice(prefix.length),
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  private async validatePatient(patientId: string, orgId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, orgId },
    });
    if (!patient) {
      throw new BadRequestException(`Patient with id ${patientId} not found`);
    }
    return patient;
  }

  private async validateAdmission(admissionId: string, orgId: string) {
    const admission = await this.prisma.admission.findFirst({
      where: { id: admissionId, orgId },
      include: { patient: true, room: true },
    });
    if (!admission) {
      throw new BadRequestException(
        `Admission with id ${admissionId} not found`,
      );
    }
    return admission;
  }

  private assertEditable(order: { status: string }) {
    if (order.status !== DispenseOrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify order with status ${order.status}. Only PENDING orders can be edited.`,
      );
    }
  }

  private includeRelations = {
    admission: { include: { patient: true } },
    items: { orderBy: { createdAt: 'asc' } },
  } as const;

  async findOneDispenseOrderThisDay(
    admissionId: string,
    organizationId: string,
    date: Date = new Date(),
  ): Promise<DispenseOrder | null> {
    return this.prisma.dispenseOrder.findFirst({
      where: {
        orgId: organizationId,
        admissionId,
        status: { not: DispenseOrderStatus.CANCELLED },
        orderDate: date.toISOString(), // Compare only the date part
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    dto: CreateDispenseOrderDto,
    organizationId: string,
    authToken: string,
    userId: string,
  ) {
    const orderDate = dto.admissionDate
      ? new Date(dto.admissionDate)
      : new Date();
    const admission = await this.validateAdmission(
      dto.admissionId,
      organizationId,
    );
    const existingOrder = await this.findOneDispenseOrderThisDay(
      dto.admissionId,
      organizationId,
      orderDate,
    );
    if (existingOrder) {
      throw new BadRequestException(
        `A dispense order for this admission already exists with ID ${existingOrder.id}`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const drugIds = dto.items.map((item) => item.drugId);
    const products = await this.warehouseService.getProductsByIds(
      drugIds,
      authToken,
    );

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumber(organizationId);

      const order = await tx.dispenseOrder.create({
        data: {
          orgId: organizationId,
          orderNumber,
          patientId: admission.patientId,
          admissionId: dto.admissionId,
          notes: dto.notes ?? '',
          status: DispenseOrderStatus.PENDING,
          orderDate: orderDate.toISOString(),
          createdBy: userId,
        },
      });

      const createItemMap = new Map(
        dto.items.map((item) => [item.drugId, item]),
      );
      await tx.dispenseOrderItem.createMany({
        data: products.map((product) => {
          const item = createItemMap.get(product.id)!;
          return {
            drugId: product.id,
            quantity: item.quantity,
            instructions: item.instructions,
            dispenseOrderId: order.id,
            createdBy: userId,
          } as Prisma.DispenseOrderItemCreateManyInput;
        }),
      });
    });
  }

  async findAll(
    organizationId: string,
    query: DispenseOrderQueryDto,
    authToken: string,
  ): Promise<PaginatedResponseDto<IGetDispenseOrderResponse> | { data: IGetDispenseOrderResponse[] }> {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        {
          admission: {
            admissionNumber: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          admission: {
            patient: { name: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }
    if (query.ids && query.ids.length > 0) {
      where.id = { in: query.ids };
    }
    if (query.startDate || query.endDate) {
      const startDate = query.startDate
        ? new Date(query.startDate)
        : undefined;
      const endDate = query.endDate
        ? new Date(query.endDate)
        : undefined;
      where.orderDate = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [rawData, total] = await Promise.all([
      this.prisma.dispenseOrder.findMany({
        where,
        include: this.includeRelations,
        orderBy: { orderDate: 'desc' },
        ...(query.isExport ? {} : {
          skip: query.skip,
          take: query.take,
        })
      }),
      this.prisma.dispenseOrder.count({ where }),
    ]);

    const productIds = new Set(rawData.flatMap(data => data.items.flatMap(item => item.drugId)));
    const productDetailList = await this.warehouseService.getProductsByIds([...productIds], authToken);
    const prodcutDetailMap = new Map(productDetailList.map(p => [p.id, p]));

    const data = rawData.map((orderData) => {
      const { admission, items, ...order } = orderData;
      return {
      ...order,
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      patientId: order.patientId,
      patientName: admission.patient.name,
      admissionId: order.admissionId,
      dispensedAt: order.dispensedAt,
      notes: order.notes,
      cancelReason: order.cancelReason,
      status: order.status,
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      type: admission.type ?? null,
      admissionNumber: admission.admissionNumber ?? null,
      admissionDate: admission.admissionDate ?? null,
      roomId: admission.roomId ?? null,
      items: items.map((item) => {
        const product = prodcutDetailMap.get(item.drugId);
        return {
          id: item.id,
          drugId: product?.id,
          drugName: product?.name,
          quantity: item.quantity,
          instructions: item.instructions,
          baseUnitId: product?.baseUnitId,
          baseUnitName: product?.baseUnitName,
          baseUnitCode: product?.baseUnitCode,
          baseUnitAbbreviation: product?.baseUnitAbbreviation,
        };
      }),

    }}) as IGetDispenseOrderResponse[];
    
    if(query.isExport) return { data };

    return PaginatedResponseDto.create(data, total, query);
  }

  async getDispenseOrderById(
    id: string,
    organizationId: string,
    authToken: string,
  ) {
    const order = await this.findOne(id, organizationId);
    const items =
      order.items?.map((item) => ({
        id: item.id,
        drugId: item.drugId,
        quantity: item.quantity,
        instructions: item.instructions,
      })) ?? [];

    const productDetailList = await this.warehouseService.getProductsByIds(
      items.map((item) => item.drugId),
      authToken,
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      patientId: order.patientId,
      patientName: order.admission.patient.name ?? null,
      admissionId: order.admissionId,
      dispensedAt: order.dispensedAt,
      notes: order.notes,
      cancelReason: order.cancelReason,
      status: order.status,
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      admission_type: order.admission.type ?? null,
      admissionNumber: order.admission.admissionNumber ?? null,
      admissionDate: order.admission.admissionDate ?? null,
      admissionStatus: order.admission.status ?? null,
      admissionNotes: order.admission.notes ?? null,
      admissionCreatedAt: order.admission.createdAt ?? null,
      items: productDetailList.map((product) => {
        const item = items.find((i) => i.drugId === product.id);
        return {
          id: item?.id,
          drugId: product.id,
          drugName: product.name,
          quantity: item?.quantity,
          instructions: item?.instructions,
          baseUnitId: product.baseUnitId,
          baseUnitName: product.baseUnitName,
          baseUnitCode: product.baseUnitCode,
          baseUnitAbbreviation: product.baseUnitAbbreviation,
        };
      }),
    };
  }

  async findOne(id: string, organizationId: string) {
    const order = await this.prisma.dispenseOrder.findFirst({
      where: { id, orgId: organizationId },
      include: this.includeRelations,
    });

    if (!order) {
      throw new BadRequestException(`Dispense order with id ${id} not found`);
    }

    return order;
  }

  async update(
    id: string,
    dto: UpdateDispenseOrderDto,
    organizationId: string,
    userId: string,
  ) {
    const order = await this.findOne(id, organizationId);
    this.assertEditable(order);
    if (order.status !== DispenseOrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update order with status ${order.status}. Only PENDING orders can be updated.`,
      );
    }

    const updateData: Partial<DispenseOrder> = {};
    updateData.updatedAt = new Date();
    updateData.updatedBy = userId;

    if (dto.admissionId !== undefined) updateData.admissionId = dto.admissionId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.dispenseOrder.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });
  }

  async addItem(
    orderId: string,
    dto: AddDispenseOrderItemDto,
    organizationId: string,
    authToken: string,
    userId: string,
  ) {
    const order = await this.findOne(orderId, organizationId);
    this.assertEditable(order);

    const product = await this.warehouseService.getProductById(
      dto.drugId,
      authToken,
    );

    return this.prisma.dispenseOrderItem.create({
      data: {
        dispenseOrderId: orderId,
        drugId: dto.drugId,
        quantity: dto.quantity,
        instructions: dto.instructions,
        createdBy: userId,
      },
    });
  }

  async updateItems(
    orderId: string,
    dto: UpdateDispenseOrderItemDto,
    organizationId: string,
    authToken: string,
    userId: string,
  ) {
    const order = await this.findOne(orderId, organizationId);

    const updateStatusValidation: DispenseOrderStatus[] = [
      DispenseOrderStatus.PENDING,
      DispenseOrderStatus.PREPARING,
    ];
    if (order && !updateStatusValidation.includes(order.status)) {
      throw new BadRequestException(
        `Cannot modify items of an order with status ${order.status}. Only PENDING or PREPARING orders can be edited.`,
      );
    }

    const drugIds = dto.items.map((item) => item.drugId);
    const products = await this.warehouseService.getProductsByIds(
      drugIds,
      authToken,
    );

    return this.prisma.$transaction(async (tx) => {
      const updateOrderData: Partial<DispenseOrder> = {
        updatedAt: new Date(),
        updatedBy: userId,
      };
      if (dto.notes !== undefined) {
        updateOrderData.notes = dto.notes;
      }

      await tx.dispenseOrder.update({
        where: { id: orderId },
        data: updateOrderData,
      });

      await tx.dispenseOrderItem.deleteMany({
        where: { dispenseOrderId: orderId },
      });

      const createItemMap = new Map(
        dto.items.map((item) => [item.drugId, item]),
      );
      await tx.dispenseOrderItem.createMany({
        data: products.map((product) => {
          const item = createItemMap.get(product.id)!;
          return {
            drugId: product.id,
            quantity: item.quantity,
            instructions: item.instructions,
            dispenseOrderId: order.id,
            createdBy: userId,
          } as Prisma.DispenseOrderItemCreateManyInput;
        }),
      });

      return tx.dispenseOrder.findFirst({
        where: { id: order.id },
        include: this.includeRelations,
      });
    });
  }

  async removeItem(orderId: string, itemId: string, organizationId: string) {
    const order = await this.findOne(orderId, organizationId);
    this.assertEditable(order);

    const item = await this.prisma.dispenseOrderItem.findFirst({
      where: { id: itemId, dispenseOrderId: orderId },
    });

    if (!item) {
      throw new BadRequestException(
        `Item with id ${itemId} not found in this order`,
      );
    }

    await this.prisma.dispenseOrderItem.delete({
      where: { id: itemId },
    });
  }

  async startPreparation(
    orderId: string,
    organizationId: string,
    userId: string,
  ) {
    const order = await this.findOne(orderId, organizationId);

    if (order.status !== DispenseOrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot prepare order with status ${order.status}. Only PENDING orders can be prepared.`,
      );
    }

    return this.prisma.dispenseOrder.update({
      where: { id: orderId },
      data: {
        status: DispenseOrderStatus.PREPARING,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      // include: this.includeRelations,
    });
  }

  async dispense(orderId: string, organizationId: string, userId: string) {
    const order = await this.findOne(orderId, organizationId);

    if (order.status !== DispenseOrderStatus.PREPARING) {
      throw new BadRequestException(
        `Cannot dispense order with status ${order.status}. Only PREPARING orders can be dispensed.`,
      );
    }

    if (!order.items || order.items.length === 0) {
      throw new BadRequestException('Cannot dispense an order with no items');
    }

    return this.prisma.dispenseOrder.update({
      where: { id: orderId },
      data: {
        status: DispenseOrderStatus.DISPENSED,
        dispensedAt: new Date(),
        updatedBy: userId,
      },
      // include: this.includeRelations,
    });
  }

  async cancel(
    orderId: string,
    dto: CancelDispenseOrderDto,
    organizationId: string,
    userId: string,
  ) {
    const order = await this.findOne(orderId, organizationId);

    if (order.status === DispenseOrderStatus.DISPENSED) {
      throw new BadRequestException(
        'Cannot cancel a DISPENSED order. It has already been issued to the patient.',
      );
    }

    if (order.status === DispenseOrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    return this.prisma.dispenseOrder.update({
      where: { id: orderId },
      data: {
        status: DispenseOrderStatus.CANCELLED,
        cancelReason: dto.reason,
        // cancelledAt: new Date(),
        updatedBy: userId,
      },
      include: this.includeRelations,
    });
  }
}
