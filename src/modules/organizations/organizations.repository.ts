import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

const userOrgSelect = {
  userOrganizations: {
    select: {
      id: true,
      userId: true,
      roleId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

@Injectable()
export class OrganizationsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.organization.findMany({
      include: userOrgSelect,
    });
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: userOrgSelect,
    });
    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }
    return organization;
  }

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: userOrgSelect,
    });
    if (!organization) {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }
    return organization;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    website?: string;
    logoUrl?: string;
  }) {
    return this.prisma.organization.create({
      data,
      include: userOrgSelect,
    });
  }

  async update(id: string, data: { [key: string]: unknown }) {
    await this.findById(id);
    return this.prisma.organization.update({
      where: { id },
      data,
      include: userOrgSelect,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.organization.delete({ where: { id } });
  }
}
