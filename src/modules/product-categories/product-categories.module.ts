import { Module } from '@nestjs/common';
import { ProductCategoriesController } from './product-categories.controller.js';
import { ProductCategoriesService } from './product-categories.service.js';

@Module({
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService],
})
export class ProductCategoriesModule {}
