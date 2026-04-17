import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/index.js';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  private async generateAdmissionNumber(
    organizationId: string,
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ADM-${dateStr}-`;

    const lastAdmission = await this.prisma.admission.findFirst({
      where: {
        orgId: organizationId,
        admissionNumber: { startsWith: prefix },
      },
      orderBy: { admissionNumber: 'desc' },
    });

    let sequence = 1;
    if (lastAdmission) {
      const lastSequence = parseInt(
        lastAdmission.admissionNumber.slice(prefix.length),
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async create(dto: CreateAdmissionDto, organizationId: string) {
    const admissionNumber = await this.generateAdmissionNumber(organizationId);

    if (dto.wardId) {
      const ward = await this.prisma.location.findFirst({
        where: { id: dto.wardId, orgId: organizationId },
      });
      if (!ward) {
        throw new NotFoundException(`Ward with id ${dto.wardId} not found`);
      }
    }

    return this.prisma.admission.create({
      data: {
        orgId: organizationId,
        patientId: dto.patientId,
        admissionNumber,
        admissionDate: new Date(dto.admissionDate),
        dischargeDate: dto.dischargeDate
          ? new Date(dto.dischargeDate)
          : undefined,
        wardId: dto.wardId,
        diagnosis: dto.diagnosis,
        status: dto.status,
        notes: dto.notes,
      },
      include: { patient: true, ward: true },
    });
  }

  async findAll(organizationId: string, status?: string, patientId?: string) {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.admission.findMany({
      where,
      include: { patient: true, ward: true },
      orderBy: { admissionDate: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const admission = await this.prisma.admission.findFirst({
      where: { id, orgId: organizationId },
      include: { patient: true, ward: true },
    });

    if (!admission) {
      throw new NotFoundException(`Admission with id ${id} not found`);
    }

    return admission;
  }

  async update(id: string, dto: UpdateAdmissionDto, organizationId: string) {
    await this.findOne(id, organizationId);

    if (dto.wardId) {
      const ward = await this.prisma.location.findFirst({
        where: { id: dto.wardId, orgId: organizationId },
      });
      if (!ward) {
        throw new NotFoundException(`Ward with id ${dto.wardId} not found`);
      }
    }

    return this.prisma.admission.update({
      where: { id },
      data: {
        ...(dto.admissionDate !== undefined && {
          admissionDate: new Date(dto.admissionDate),
        }),
        ...(dto.dischargeDate !== undefined && {
          dischargeDate: dto.dischargeDate ? new Date(dto.dischargeDate) : null,
        }),
        ...(dto.wardId !== undefined && {
          wardId: dto.wardId,
        }),
        ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { patient: true, ward: true },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.admission.delete({
      where: { id },
    });
  }
}
