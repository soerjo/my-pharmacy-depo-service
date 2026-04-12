import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async getLowStockAlerts(organizationId: string) {
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        code: string;
        name: string;
        productType: string;
        minStock: number;
        totalStock: number;
      }>
    >(Prisma.sql`
      SELECT p.id, p.code, p.name, p.productType, p."minStock", COALESCE(SUM(bi.quantity), 0)::int as "totalStock"
      FROM "Product" p
      LEFT JOIN "BatchInventory" bi ON bi."productId" = p.id
      WHERE p."organizationId" = ${organizationId} AND p."isActive" = true
      GROUP BY p.id, p.code, p.name, p.productType, p."minStock"
      HAVING COALESCE(SUM(bi.quantity), 0) <= p."minStock"
      ORDER BY p.name
    `);
  }

  async getExpiringBatchAlerts(organizationId: string) {
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        batchNumber: string;
        productName: string;
        expirationDate: Date;
        remainingQty: number;
      }>
    >(Prisma.sql`
      SELECT b.id, b."batchNumber", p.name as "productName", b."expirationDate", SUM(bi.quantity)::int as "remainingQty"
      FROM "Batch" b
      JOIN "BatchInventory" bi ON bi."batchId" = b.id
      JOIN "Product" p ON b."productId" = p.id
      WHERE b."organizationId" = ${organizationId} AND b."isActive" = true
        AND b."expirationDate" BETWEEN now() AND now() + interval '30 days'
        AND bi.quantity > 0
      GROUP BY b.id, b."batchNumber", p.name, b."expirationDate"
      ORDER BY b."expirationDate" ASC
    `);
  }

  async getOverstockAlerts(organizationId: string) {
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        code: string;
        name: string;
        productType: string;
        maxStock: number;
        totalStock: number;
      }>
    >(Prisma.sql`
      SELECT p.id, p.code, p.name, p.productType, p."maxStock", SUM(bi.quantity)::int as "totalStock"
      FROM "BatchInventory" bi
      JOIN "Product" p ON bi."productId" = p.id
      WHERE bi."organizationId" = ${organizationId} AND p."maxStock" IS NOT NULL AND p."isActive" = true
      GROUP BY p.id, p.code, p.name, p.productType, p."maxStock"
      HAVING SUM(bi.quantity) > p."maxStock"
      ORDER BY p.name
    `);
  }

  async getStockByLocation(locationId: string, organizationId: string) {
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        code: string;
        name: string;
        productType: string;
        baseUnit: string | null;
        totalStock: number;
      }>
    >(Prisma.sql`
      SELECT p.id, p.code, p.name, p.productType, u.name as "baseUnit", SUM(bi.quantity)::int as "totalStock"
      FROM "BatchInventory" bi
      JOIN "Product" p ON bi."productId" = p.id
      LEFT JOIN "UnitOfMeasure" u ON p."baseUnitId" = u.id
      WHERE bi."locationId" = ${locationId} AND bi."organizationId" = ${organizationId}
      GROUP BY p.id, p.code, p.name, p.productType, u.name
      ORDER BY p.name
    `);
  }

  async getTotalStock(productId: string, organizationId: string) {
    const result = await this.prisma.batchInventory.aggregate({
      where: { productId, organizationId },
      _sum: { quantity: true },
    });

    return { productId, totalStock: result._sum.quantity ?? 0 };
  }
}
