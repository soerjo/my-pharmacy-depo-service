import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateAdmissionDto,
  UpdateAdmissionDto,
  QueryAdmissionDto,
} from './dto/index.js';
import { AdmissionStatus } from '@prisma/client';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto.js';
import {
  AdmissionResponseDto,
  mapAdmissionResponse,
} from './dto/admission-response.dto.js';
import { Prisma } from '@prisma/client';
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

    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, orgId: organizationId },
      });
      if (!room) {
        throw new NotFoundException(`Room with id ${dto.roomId} not found`);
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
        roomId: dto.roomId,
        diagnosis: dto.diagnosis,
        status: AdmissionStatus.ADMITTED,
        notes: dto.notes,
      },
      include: { patient: true, room: true },
    });

    return mapAdmissionResponse(admission);
  }

  async discharge(
    id: string,
    organizationId: string,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.findOne(id, organizationId);

    if (admission.status === AdmissionStatus.DISCHARGED) {
      throw new NotFoundException(
        `Admission with id ${id} is already discharged`,
      );
    }

    const updatedAdmission = await this.prisma.admission.update({
      where: { id },
      data: {
        dischargeDate: new Date(),
        status: AdmissionStatus.DISCHARGED,
      },
      include: { patient: true, room: true },
    });

    return mapAdmissionResponse(updatedAdmission);
  }

  async findAll(
    organizationId: string,
    query: QueryAdmissionDto,
  ): Promise<PaginatedResponseDto<AdmissionResponseDto>> {
    const where: Prisma.AdmissionWhereInput = { orgId: organizationId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.admissionDate = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && {
          lt: new Date(new Date(query.endDate).getTime() + 24 * 60 * 60 * 1000),
        }),
      };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { admissionNumber: { contains: term, mode: 'insensitive' } },
        { patient: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.admission.findMany({
        where,
        include: { patient: true, room: true },
        orderBy: { admissionDate: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.admission.count({ where }),
    ]);

    return PaginatedResponseDto.create(
      data.map(mapAdmissionResponse),
      total,
      query,
    );
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.prisma.admission.findFirst({
      where: { id, orgId: organizationId },
      include: { patient: true, room: true },
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

    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, orgId: organizationId },
      });
      if (!room) {
        throw new NotFoundException(`Room with id ${dto.roomId} not found`);
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
        ...(dto.roomId !== undefined && {
          roomId: dto.roomId,
        }),
        ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { patient: true, room: true },
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
