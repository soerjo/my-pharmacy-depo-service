import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFormulaDto, UpdateFormulaDto } from './dto/index.js';

@Injectable()
export class FormulasService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeConfig = {
    ingredients: {
      include: {
        product: true,
        unitOfMeasure: true,
      },
    },
    product: true,
    yieldUnit: true,
  };

  async create(organizationId: string, dto: CreateFormulaDto) {
    await this.validateProduct(dto.productId, organizationId);
    await this.validateUnitOfMeasure(dto.yieldUnitId, organizationId);

    const productIds = dto.ingredients.map((i) => i.productId);
    const uomIds = dto.ingredients.map((i) => i.unitOfMeasureId);

    await this.validateProductsExist(productIds, organizationId);
    await this.validateUnitOfMeasuresExist(uomIds, organizationId);

    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException('Duplicate productId found in ingredients');
    }

    return this.prisma.$transaction(async (tx) => {
      const formula = await tx.formula.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          dosageForm: dto.dosageForm,
          totalYield: dto.totalYield,
          yieldUnitId: dto.yieldUnitId,
          instructions: dto.instructions,
          productId: dto.productId,
          organizationId,
        },
        include: this.includeConfig,
      });

      await tx.formulaIngredient.createMany({
        data: dto.ingredients.map((ingredient) => ({
          formulaId: formula.id,
          productId: ingredient.productId,
          quantity: ingredient.quantity,
          unitOfMeasureId: ingredient.unitOfMeasureId,
          notes: ingredient.notes,
        })),
      });

      return tx.formula.findUnique({
        where: { id: formula.id },
        include: this.includeConfig,
      });
    });
  }

  async findAll(
    organizationId: string,
    isActive?: boolean,
    productId?: string,
  ) {
    return this.prisma.formula.findMany({
      where: {
        organizationId,
        ...(isActive !== undefined && { isActive }),
        ...(productId && { productId }),
      },
      include: this.includeConfig,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
      include: this.includeConfig,
    });

    if (!formula || formula.organizationId !== organizationId) {
      throw new NotFoundException('Formula not found');
    }

    return formula;
  }

  async update(organizationId: string, id: string, dto: UpdateFormulaDto) {
    await this.findOne(organizationId, id);

    if (dto.yieldUnitId) {
      await this.validateUnitOfMeasure(dto.yieldUnitId, organizationId);
    }

    const data: Prisma.FormulaUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dosageForm !== undefined) data.dosageForm = dto.dosageForm;
    if (dto.totalYield !== undefined) data.totalYield = dto.totalYield;
    if (dto.yieldUnitId !== undefined)
      data.yieldUnit = { connect: { id: dto.yieldUnitId } };
    if (dto.instructions !== undefined) data.instructions = dto.instructions;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.formula.update({
      where: { id },
      data,
      include: this.includeConfig,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    const nonTerminalBatches = await this.prisma.compoundingBatch.count({
      where: {
        formulaId: id,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'FAILED'] },
      },
    });

    if (nonTerminalBatches > 0) {
      throw new BadRequestException(
        'Cannot deactivate formula: it is referenced by active compounding batches',
      );
    }

    return this.prisma.formula.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async validateProduct(productId: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id ${productId} not found in organization`,
      );
    }
  }

  private async validateUnitOfMeasure(uomId: string, organizationId: string) {
    const uom = await this.prisma.unitOfMeasure.findFirst({
      where: { id: uomId, organizationId },
    });

    if (!uom) {
      throw new NotFoundException(
        `UnitOfMeasure with id ${uomId} not found in organization`,
      );
    }
  }

  private async validateProductsExist(
    productIds: string[],
    organizationId: string,
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId,
      },
      select: { id: true },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Products with ids [${missingIds.join(', ')}] not found in organization`,
      );
    }
  }

  private async validateUnitOfMeasuresExist(
    uomIds: string[],
    organizationId: string,
  ) {
    const uoms = await this.prisma.unitOfMeasure.findMany({
      where: {
        id: { in: uomIds },
        organizationId,
      },
      select: { id: true },
    });

    const foundIds = new Set(uoms.map((u) => u.id));
    const missingIds = uomIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `UnitOfMeasures with ids [${missingIds.join(', ')}] not found in organization`,
      );
    }
  }
}
