import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/index.js';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateProductCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.productCategory.findFirst({
        where: {
          id: dto.parentId,
          organizationId,
        },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.prisma.productCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, parentId?: string, isActive?: boolean) {
    return this.prisma.productCategory.findMany({
      where: {
        organizationId,
        parentId: parentId ?? null,
        ...(isActive !== undefined && { products: { some: {} } }),
      },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id, organizationId },
      include: {
        parent: true,
        children: true,
      },
    });
    if (!category) {
      throw new NotFoundException('Product category not found');
    }
    return category;
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateProductCategoryDto,
  ) {
    await this.findOne(id, organizationId);

    return this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const category = await this.findOne(id, organizationId);

    const hasActiveChildren = await this.prisma.productCategory.count({
      where: {
        parentId: id,
        organizationId,
      },
    });
    if (hasActiveChildren > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing subcategories',
      );
    }

    const hasProducts = await this.prisma.product.count({
      where: {
        categoryId: id,
        organizationId,
      },
    });
    if (hasProducts > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing products',
      );
    }

    await this.prisma.productCategory.delete({
      where: { id: category.id },
    });

    return { deleted: true };
  }
}
