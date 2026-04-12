import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateWarehouseLocationDto,
  UpdateWarehouseLocationDto,
} from './dto/index.js';
import { LocationType } from '@prisma/client';

@Injectable()
export class WarehouseLocationsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateWarehouseLocationDto, organizationId: string) {
    return this.prisma.warehouseLocation.create({
      data: {
        code: data.code,
        name: data.name,
        zone: data.zone,
        shelf: data.shelf,
        bin: data.bin,
        locationType: data.locationType,
        organizationId,
      },
    });
  }

  findAll(
    organizationId: string,
    isActive?: boolean,
    locationType?: LocationType,
  ) {
    return this.prisma.warehouseLocation.findMany({
      where: {
        organizationId,
        ...(isActive !== undefined && { isActive }),
        ...(locationType && { locationType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string, organizationId: string) {
    return this.prisma.warehouseLocation.findFirst({
      where: { id, organizationId },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateWarehouseLocationDto,
  ) {
    await this.prisma.warehouseLocation
      .findFirstOrThrow({
        where: { id, organizationId },
      })
      .catch(() => {
        throw new NotFoundException(
          `Warehouse location with id ${id} not found`,
        );
      });

    return this.prisma.warehouseLocation.update({
      where: { id },
      data: {
        name: data.name,
        zone: data.zone,
        shelf: data.shelf,
        bin: data.bin,
        locationType: data.locationType,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.prisma.warehouseLocation
      .findFirstOrThrow({
        where: { id, organizationId },
      })
      .catch(() => {
        throw new NotFoundException(
          `Warehouse location with id ${id} not found`,
        );
      });

    return this.prisma.warehouseLocation.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
