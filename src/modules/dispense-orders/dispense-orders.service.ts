import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateDispenseOrderDto,
  UpdateDispenseOrderDto,
  AddDispenseOrderItemDto,
  UpdateDispenseOrderItemDto,
  CancelDispenseOrderDto,
} from './dto/index.js';
import { DispenseOrderStatus, DispenseType } from '@prisma/client';

@Injectable()
export class DispenseOrdersService {
  constructor(private prisma: PrismaService) {}

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
      throw new NotFoundException(`Patient with id ${patientId} not found`);
    }
    return patient;
  }

  private async validateAdmission(admissionId: string, orgId: string) {
    const admission = await this.prisma.admission.findFirst({
      where: { id: admissionId, orgId },
    });
    if (!admission) {
      throw new NotFoundException(`Admission with id ${admissionId} not found`);
    }
    return admission;
  }

  private async validateLocation(locationId: string, orgId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, orgId },
    });
    if (!location) {
      throw new NotFoundException(`Location with id ${locationId} not found`);
    }
    return location;
  }

  private assertEditable(order: { status: string }) {
    if (order.status !== DispenseOrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify order with status ${order.status}. Only PENDING orders can be edited.`,
      );
    }
  }

  private includeRelations = {
    patient: true,
    admission: true,
    location: true,
    items: { orderBy: { createdAt: 'asc' } },
  } as const;

  async create(dto: CreateDispenseOrderDto, organizationId: string) {
    await this.validatePatient(dto.patientId, organizationId);

    if (dto.type === DispenseType.INPATIENT) {
      if (!dto.admissionId) {
        throw new BadRequestException(
          'admissionId is required for INPATIENT dispense orders',
        );
      }
      await this.validateAdmission(dto.admissionId, organizationId);

      if (dto.locationId) {
        await this.validateLocation(dto.locationId, organizationId);
      }
    }

    if (dto.locationId) {
      await this.validateLocation(dto.locationId, organizationId);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const orderNumber = await this.generateOrderNumber(organizationId);

    return this.prisma.dispenseOrder.create({
      data: {
        orgId: organizationId,
        orderNumber,
        patientId: dto.patientId,
        admissionId: dto.admissionId,
        type: dto.type,
        locationId: dto.locationId,
        notes: dto.notes,
        items: { create: dto.items },
      },
      include: this.includeRelations,
    });
  }

  async findAll(
    organizationId: string,
    status?: string,
    patientId?: string,
    admissionId?: string,
    type?: string,
  ) {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (admissionId) {
      where.admissionId = admissionId;
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.dispenseOrder.findMany({
      where,
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const order = await this.prisma.dispenseOrder.findFirst({
      where: { id, orgId: organizationId },
      include: this.includeRelations,
    });

    if (!order) {
      throw new NotFoundException(`Dispense order with id ${id} not found`);
    }

    return order;
  }

  async update(
    id: string,
    dto: UpdateDispenseOrderDto,
    organizationId: string,
  ) {
    const order = await this.findOne(id, organizationId);
    this.assertEditable(order);

    if (dto.admissionId) {
      await this.validateAdmission(dto.admissionId, organizationId);
    }

    if (dto.locationId) {
      await this.validateLocation(dto.locationId, organizationId);
    }

    if (dto.patientId) {
      await this.validatePatient(dto.patientId, organizationId);
    }

    if (
      dto.type === DispenseType.INPATIENT &&
      !dto.admissionId &&
      !order.admissionId
    ) {
      throw new BadRequestException(
        'admissionId is required for INPATIENT dispense orders',
      );
    }

    const updateData: Record<string, unknown> = {};

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.admissionId !== undefined) updateData.admissionId = dto.admissionId;
    if (dto.locationId !== undefined) updateData.locationId = dto.locationId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.patientId !== undefined) updateData.patientId = dto.patientId;

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
  ) {
    const order = await this.findOne(orderId, organizationId);
    this.assertEditable(order);

    return this.prisma.dispenseOrderItem.create({
      data: {
        dispenseOrderId: orderId,
        drugId: dto.drugId,
        drugName: dto.drugName,
        batchNumber: dto.batchNumber,
        quantity: dto.quantity,
        dosage: dto.dosage,
        frequency: dto.frequency,
        duration: dto.duration,
        instructions: dto.instructions,
      },
    });
  }

  async updateItem(
    orderId: string,
    itemId: string,
    dto: UpdateDispenseOrderItemDto,
    organizationId: string,
  ) {
    const order = await this.findOne(orderId, organizationId);
    this.assertEditable(order);

    const item = await this.prisma.dispenseOrderItem.findFirst({
      where: { id: itemId, dispenseOrderId: orderId },
    });

    if (!item) {
      throw new NotFoundException(
        `Item with id ${itemId} not found in this order`,
      );
    }

    const updateData: Record<string, unknown> = {};

    if (dto.drugId !== undefined) updateData.drugId = dto.drugId;
    if (dto.drugName !== undefined) updateData.drugName = dto.drugName;
    if (dto.batchNumber !== undefined) updateData.batchNumber = dto.batchNumber;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.dosage !== undefined) updateData.dosage = dto.dosage;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.instructions !== undefined)
      updateData.instructions = dto.instructions;

    return this.prisma.dispenseOrderItem.update({
      where: { id: itemId },
      data: updateData,
    });
  }

  async removeItem(orderId: string, itemId: string, organizationId: string) {
    const order = await this.findOne(orderId, organizationId);
    this.assertEditable(order);

    const item = await this.prisma.dispenseOrderItem.findFirst({
      where: { id: itemId, dispenseOrderId: orderId },
    });

    if (!item) {
      throw new NotFoundException(
        `Item with id ${itemId} not found in this order`,
      );
    }

    await this.prisma.dispenseOrderItem.delete({
      where: { id: itemId },
    });
  }

  async startPreparation(orderId: string, organizationId: string) {
    const order = await this.findOne(orderId, organizationId);

    if (order.status !== DispenseOrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot prepare order with status ${order.status}. Only PENDING orders can be prepared.`,
      );
    }

    return this.prisma.dispenseOrder.update({
      where: { id: orderId },
      data: { status: DispenseOrderStatus.PREPARING },
      include: this.includeRelations,
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

    for (const item of order.items) {
      if (!item.batchNumber) {
        throw new BadRequestException(
          `Item "${item.drugName}" (${item.id}) must have a batchNumber assigned before dispensing`,
        );
      }
    }

    return this.prisma.dispenseOrder.update({
      where: { id: orderId },
      data: {
        status: DispenseOrderStatus.DISPENSED,
        dispensedById: userId,
        dispensedAt: new Date(),
      },
      include: this.includeRelations,
    });
  }

  async cancel(
    orderId: string,
    dto: CancelDispenseOrderDto,
    organizationId: string,
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
      },
      include: this.includeRelations,
    });
  }

  async remove(id: string, organizationId: string) {
    const order = await this.findOne(id, organizationId);
    this.assertEditable(order);

    await this.prisma.dispenseOrder.delete({
      where: { id },
    });
  }
}
