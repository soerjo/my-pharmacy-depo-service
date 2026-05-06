import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePatientDto, UpdatePatientDto } from './dto/index.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto.js';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  private async generateMrn(organizationId: string): Promise<string> {
    const year = String(new Date().getFullYear()).slice(-2);
    const prefix = `${year}`;

    const lastPatient = await this.prisma.patient.findFirst({
      where: {
        orgId: organizationId,
        mrn: { startsWith: prefix },
      },
      orderBy: { mrn: 'desc' },
      select: { mrn: true },
    });

    let sequence = 1;
    if (lastPatient) {
      const lastSequence = parseInt(lastPatient.mrn.slice(2), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  async create(dto: CreatePatientDto, organizationId: string) {
    const mrn = dto.mrn || (await this.generateMrn(organizationId));

    if (dto.mrn) {
      const existing = await this.prisma.patient.findUnique({
        where: { orgId_mrn: { orgId: organizationId, mrn: dto.mrn } },
      });
      if (existing) {
        throw new ConflictException(
          `Patient with MRN ${dto.mrn} already exists`,
        );
      }
    }

    return this.prisma.patient.create({
      data: {
        orgId: organizationId,
        mrn,
        name: dto.name,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        phone: dto.phone,
        address: dto.address,
        allergies: dto.allergies,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    organizationId: string,
    pagination: PaginationDto,
    isActive?: boolean,
    search?: string,
  ): Promise<PaginatedResponseDto<unknown>> {
    const where: Record<string, unknown> = { orgId: organizationId };

    if (isActive !== undefined) {
      where.active = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mrn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return PaginatedResponseDto.create(data, total, pagination);
  }

  async findOne(id: string, organizationId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, orgId: organizationId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id ${id} not found`);
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...(dto.mrn !== undefined && { mrn: dto.mrn }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.allergies !== undefined && { allergies: dto.allergies }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.patient.update({
      where: { id },
      data: { active: false },
    });
  }
}
