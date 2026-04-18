import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/index.js';
import { AdmissionStatus } from '@prisma/client';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto.js';
import {
  AdmissionResponseDto,
  mapAdmissionResponse,
} from './dto/admission-response.dto.js';
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

  async create(
    dto: CreateAdmissionDto,
    organizationId: string,
  ): Promise<AdmissionResponseDto> {
    const admissionNumber = await this.generateAdmissionNumber(organizationId);

    if (dto.wardId) {
      const ward = await this.prisma.location.findFirst({
        where: { id: dto.wardId, orgId: organizationId },
      });
      if (!ward) {
        throw new NotFoundException(`Ward with id ${dto.wardId} not found`);
      }
    }

    const admission = await this.prisma.admission.create({
      data: {
        orgId: organizationId,
        patientId: dto.patientId,
        admissionNumber,
        admissionDate: dto.admissionDate
          ? new Date(dto.admissionDate)
          : new Date(),
        wardId: dto.wardId,
        diagnosis: dto.diagnosis,
        status: AdmissionStatus.ADMITTED,
        notes: dto.notes,
      },
      include: { patient: true, ward: true },
    });

    return mapAdmissionResponse(admission);
  }

  async findAll(
    organizationId: string,
    pagination: PaginationDto,
    status?: string,
    patientId?: string,
  ): Promise<PaginatedResponseDto<AdmissionResponseDto>> {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const [data, total] = await Promise.all([
      this.prisma.admission.findMany({
        where,
        include: { patient: true, ward: true },
        orderBy: { admissionDate: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.admission.count({ where }),
    ]);

    return PaginatedResponseDto.create(
      data.map(mapAdmissionResponse),
      total,
      pagination,
    );
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.prisma.admission.findFirst({
      where: { id, orgId: organizationId },
      include: { patient: true, ward: true },
    });

    if (!admission) {
      throw new NotFoundException(`Admission with id ${id} not found`);
    }

    return mapAdmissionResponse(admission);
  }

  async update(
    id: string,
    dto: UpdateAdmissionDto,
    organizationId: string,
  ): Promise<AdmissionResponseDto> {
    await this.findOne(id, organizationId);

    if (dto.wardId) {
      const ward = await this.prisma.location.findFirst({
        where: { id: dto.wardId, orgId: organizationId },
      });
      if (!ward) {
        throw new NotFoundException(`Ward with id ${dto.wardId} not found`);
      }
    }

    const admission = await this.prisma.admission.update({
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

    return mapAdmissionResponse(admission);
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.admission.delete({
      where: { id },
    });
  }
}
