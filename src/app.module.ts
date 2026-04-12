import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { UserOrganizationsModule } from './modules/user-organizations/user-organizations.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UnitOfMeasuresModule } from './modules/unit-of-measures/unit-of-measures.module.js';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module.js';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module.js';
import { SuppliersModule } from './modules/suppliers/suppliers.module.js';
import { WarehouseLocationsModule } from './modules/warehouse-locations/warehouse-locations.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { BatchesModule } from './modules/batches/batches.module.js';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module.js';
import { InboundShipmentsModule } from './modules/inbound-shipments/inbound-shipments.module.js';
import { OutboundShipmentsModule } from './modules/outbound-shipments/outbound-shipments.module.js';
import { TransfersModule } from './modules/transfers/transfers.module.js';
import { StockAdjustmentsModule } from './modules/stock-adjustments/stock-adjustments.module.js';
import { FormulasModule } from './modules/formulas/formulas.module.js';
import { CompoundingBatchesModule } from './modules/compounding-batches/compounding-batches.module.js';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module.js';
import { StockModule } from './modules/stock/stock.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { loggerConfig } from './config/logger.config.js';
import { validate } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    WinstonModule.forRoot(loggerConfig),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    UserOrganizationsModule,
    EmailModule,
    HealthModule,
    UnitOfMeasuresModule,
    ProductCategoriesModule,
    ManufacturersModule,
    SuppliersModule,
    WarehouseLocationsModule,
    ProductsModule,
    BatchesModule,
    PurchaseOrdersModule,
    InboundShipmentsModule,
    OutboundShipmentsModule,
    TransfersModule,
    StockAdjustmentsModule,
    FormulasModule,
    CompoundingBatchesModule,
    StockMovementsModule,
    StockModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
