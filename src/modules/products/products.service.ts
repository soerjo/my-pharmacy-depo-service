import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/index.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateProductDto) {
    await this.validateReferences(organizationId, dto);

    const existing = await this.prisma.product.findFirst({
      where: { organizationId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        'Product with this code already exists in the organization',
      );
    }

    return this.prisma.product.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        dosageForm: dto.dosageForm,
        strength: dto.strength,
        casNumber: dto.casNumber,
        grade: dto.grade,
        minStock: dto.minStock ?? 0,
        maxStock: dto.maxStock,
        categoryId: dto.categoryId,
        manufacturerId: dto.manufacturerId,
        baseUnitId: dto.baseUnitId,
        stockingUnitId: dto.stockingUnitId,
        sellingUnitId: dto.sellingUnitId,
        purchaseUnitId: dto.purchaseUnitId,
        organizationId,
      },
      include: {
        category: true,
        manufacturer: true,
        baseUnit: true,
        stockingUnit: true,
        sellingUnit: true,
        purchaseUnit: true,
      },
    });
  }

  async findAll(
    organizationId: string,
    isActive?: boolean,
    productType?: string,
    search?: string,
    categoryId?: string,
  ) {
    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(isActive !== undefined && { isActive }),
      ...(productType && {
        productType: productType as Prisma.EnumProductTypeFilter['equals'],
      }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        manufacturer: true,
        baseUnit: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        manufacturer: true,
        baseUnit: true,
        stockingUnit: true,
        sellingUnit: true,
        purchaseUnit: true,
      },
    });

    if (!product || product.organizationId !== organizationId) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(organizationId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(organizationId, id);

    if (
      dto.categoryId ||
      dto.manufacturerId ||
      dto.baseUnitId ||
      dto.stockingUnitId ||
      dto.sellingUnitId ||
      dto.purchaseUnitId
    ) {
      await this.validateUpdateReferences(organizationId, id, dto);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dosageForm !== undefined && { dosageForm: dto.dosageForm }),
        ...(dto.strength !== undefined && { strength: dto.strength }),
        ...(dto.casNumber !== undefined && { casNumber: dto.casNumber }),
        ...(dto.grade !== undefined && { grade: dto.grade }),
        ...(dto.minStock !== undefined && { minStock: dto.minStock }),
        ...(dto.maxStock !== undefined && { maxStock: dto.maxStock }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.manufacturerId !== undefined && {
          manufacturerId: dto.manufacturerId,
        }),
        ...(dto.baseUnitId !== undefined && { baseUnitId: dto.baseUnitId }),
        ...(dto.stockingUnitId !== undefined && {
          stockingUnitId: dto.stockingUnitId,
        }),
        ...(dto.sellingUnitId !== undefined && {
          sellingUnitId: dto.sellingUnitId,
        }),
        ...(dto.purchaseUnitId !== undefined && {
          purchaseUnitId: dto.purchaseUnitId,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        category: true,
        manufacturer: true,
        baseUnit: true,
        stockingUnit: true,
        sellingUnit: true,
        purchaseUnit: true,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const product = await this.findOne(organizationId, id);

    const [activeBatches, activePOs, outboundItems] = await Promise.all([
      this.prisma.batch.count({
        where: { productId: id, isActive: true, organizationId },
      }),
      this.prisma.purchaseOrderItem.count({
        where: {
          productId: id,
          purchaseOrder: {
            status: {
              in: ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'],
            },
            organizationId,
          },
        },
      }),
      this.prisma.outboundShipmentItem.count({
        where: {
          productId: id,
          outboundShipment: {
            status: { in: ['PENDING', 'PICKING', 'PACKED'] },
            organizationId,
          },
        },
      }),
    ]);

    if (activeBatches > 0 || activePOs > 0 || outboundItems > 0) {
      throw new BadRequestException(
        'Cannot deactivate product: it is referenced by active batches, purchase orders, or outbound shipments',
      );
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });
  }

  async getStockList(organizationId: string) {
    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT
          p.id,
          p.code,
          p.name,
          p.description,
          p.product_type AS "productType",
          p.dosage_form AS "dosageForm",
          p.strength,
          p.cas_number AS "casNumber",
          p.grade,
          p.min_stock AS "minStock",
          p.max_stock AS "maxStock",
          p.category_id AS "categoryId",
          p.manufacturer_id AS "manufacturerId",
          p.base_unit_id AS "baseUnitId",
          p.stocking_unit_id AS "stockingUnitId",
          p.selling_unit_id AS "sellingUnitId",
          p.purchase_unit_id AS "purchaseUnitId",
          p.is_active AS "isActive",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          COALESCE(SUM(bi.quantity), 0)::integer AS "totalStock",
          bu.id AS "baseUnitId",
          bu.code AS "baseUnitCode",
          bu.name AS "baseUnitName",
          bu.abbreviation AS "baseUnitAbbreviation",
          pc.id AS "categoryId",
          pc.name AS "categoryName",
          m.id AS "manufacturerId",
          m.name AS "manufacturerName"
        FROM "Product" p
        LEFT JOIN "BatchInventory" bi ON bi.product_id = p.id
        LEFT JOIN "UnitOfMeasure" bu ON bu.id = p.base_unit_id
        LEFT JOIN "ProductCategory" pc ON pc.id = p.category_id
        LEFT JOIN "Manufacturer" m ON m.id = p.manufacturer_id
        WHERE p.organization_id = ${organizationId}
          AND p.is_active = true
        GROUP BY p.id, bu.id, pc.id, m.id
        HAVING COALESCE(SUM(bi.quantity), 0) > 0
        ORDER BY p.name ASC
      `,
    );
  }

  async getRawMaterialStockList(organizationId: string) {
    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT
          p.id,
          p.code,
          p.name,
          p.description,
          p.dosage_form AS "dosageForm",
          p.strength,
          p.cas_number AS "casNumber",
          p.grade,
          p.min_stock AS "minStock",
          p.max_stock AS "maxStock",
          p.is_active AS "isActive",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          COALESCE(SUM(bi.quantity), 0)::integer AS "totalStock",
          bu.id AS "baseUnitId",
          bu.code AS "baseUnitCode",
          bu.name AS "baseUnitName",
          bu.abbreviation AS "baseUnitAbbreviation",
          pc.id AS "categoryId",
          pc.name AS "categoryName",
          m.id AS "manufacturerId",
          m.name AS "manufacturerName"
        FROM "Product" p
        LEFT JOIN "BatchInventory" bi ON bi.product_id = p.id
        LEFT JOIN "UnitOfMeasure" bu ON bu.id = p.base_unit_id
        LEFT JOIN "ProductCategory" pc ON pc.id = p.category_id
        LEFT JOIN "Manufacturer" m ON m.id = p.manufacturer_id
        WHERE p.organization_id = ${organizationId}
          AND p.is_active = true
          AND p.product_type = 'RAW_MATERIAL'
        GROUP BY p.id, bu.id, pc.id, m.id
        HAVING COALESCE(SUM(bi.quantity), 0) > 0
        ORDER BY p.name ASC
      `,
    );
  }

  async getCatalog(organizationId: string) {
    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT
          p.id,
          p.code,
          p.name,
          p.description,
          p.product_type AS "productType",
          p.dosage_form AS "dosageForm",
          p.strength,
          p.cas_number AS "casNumber",
          p.grade,
          p.min_stock AS "minStock",
          p.max_stock AS "maxStock",
          p.is_active AS "isActive",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          COALESCE(SUM(bi.quantity), 0)::integer AS "totalStock",
          bu.id AS "baseUnitId",
          bu.code AS "baseUnitCode",
          bu.name AS "baseUnitName",
          bu.abbreviation AS "baseUnitAbbreviation",
          pc.id AS "categoryId",
          pc.name AS "categoryName",
          m.id AS "manufacturerId",
          m.name AS "manufacturerName"
        FROM "Product" p
        LEFT JOIN "BatchInventory" bi ON bi.product_id = p.id
        LEFT JOIN "UnitOfMeasure" bu ON bu.id = p.base_unit_id
        LEFT JOIN "ProductCategory" pc ON pc.id = p.category_id
        LEFT JOIN "Manufacturer" m ON m.id = p.manufacturer_id
        WHERE p.organization_id = ${organizationId}
        GROUP BY p.id, bu.id, pc.id, m.id
        ORDER BY p.name ASC
      `,
    );
  }

  private async validateReferences(
    organizationId: string,
    dto: CreateProductDto,
  ) {
    const [category, manufacturer, baseUnit, stockingUnit, sellingUnit] =
      await Promise.all([
        this.prisma.productCategory.findFirst({
          where: { id: dto.categoryId, organizationId },
        }),
        this.prisma.manufacturer.findFirst({
          where: { id: dto.manufacturerId, organizationId },
        }),
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.baseUnitId, organizationId },
        }),
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.stockingUnitId, organizationId },
        }),
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.sellingUnitId, organizationId },
        }),
      ]);

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (!manufacturer) {
      throw new NotFoundException('Manufacturer not found');
    }
    if (!baseUnit) {
      throw new NotFoundException('Base unit not found');
    }
    if (!stockingUnit) {
      throw new NotFoundException('Stocking unit not found');
    }
    if (!sellingUnit) {
      throw new NotFoundException('Selling unit not found');
    }

    if (dto.purchaseUnitId) {
      const purchaseUnit = await this.prisma.unitOfMeasure.findFirst({
        where: { id: dto.purchaseUnitId, organizationId },
      });
      if (!purchaseUnit) {
        throw new NotFoundException('Purchase unit not found');
      }
    }
  }

  private async validateUpdateReferences(
    organizationId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const checks: Promise<any>[] = [];

    if (dto.categoryId) {
      checks.push(
        this.prisma.productCategory.findFirst({
          where: { id: dto.categoryId, organizationId },
        }),
      );
    }
    if (dto.manufacturerId) {
      checks.push(
        this.prisma.manufacturer.findFirst({
          where: { id: dto.manufacturerId, organizationId },
        }),
      );
    }
    if (dto.baseUnitId) {
      checks.push(
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.baseUnitId, organizationId },
        }),
      );
    }
    if (dto.stockingUnitId) {
      checks.push(
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.stockingUnitId, organizationId },
        }),
      );
    }
    if (dto.sellingUnitId) {
      checks.push(
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.sellingUnitId, organizationId },
        }),
      );
    }
    if (dto.purchaseUnitId) {
      checks.push(
        this.prisma.unitOfMeasure.findFirst({
          where: { id: dto.purchaseUnitId, organizationId },
        }),
      );
    }

    const results = await Promise.all(checks);
    let idx = 0;

    if (dto.categoryId && !results[idx++]) {
      throw new NotFoundException('Category not found');
    }
    if (dto.manufacturerId && !results[idx++]) {
      throw new NotFoundException('Manufacturer not found');
    }
    if (dto.baseUnitId && !results[idx++]) {
      throw new NotFoundException('Base unit not found');
    }
    if (dto.stockingUnitId && !results[idx++]) {
      throw new NotFoundException('Stocking unit not found');
    }
    if (dto.sellingUnitId && !results[idx++]) {
      throw new NotFoundException('Selling unit not found');
    }
    if (dto.purchaseUnitId && !results[idx++]) {
      throw new NotFoundException('Purchase unit not found');
    }
  }
}
