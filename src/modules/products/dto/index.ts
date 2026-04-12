import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'PRD-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Analgesik dan Antipiretik' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProductType, default: ProductType.FINISHED_GOOD })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiPropertyOptional({ example: 'Tablet' })
  @IsString()
  @IsOptional()
  dosageForm?: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ example: '103-90-2' })
  @IsString()
  @IsOptional()
  casNumber?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical Grade' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @IsOptional()
  maxStock?: number;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'uuid-of-manufacturer' })
  @IsUUID()
  @IsNotEmpty()
  manufacturerId: string;

  @ApiProperty({ example: 'uuid-of-base-unit' })
  @IsUUID()
  @IsNotEmpty()
  baseUnitId: string;

  @ApiProperty({ example: 'uuid-of-stocking-unit' })
  @IsUUID()
  @IsNotEmpty()
  stockingUnitId: string;

  @ApiProperty({ example: 'uuid-of-selling-unit' })
  @IsUUID()
  @IsNotEmpty()
  sellingUnitId: string;

  @ApiPropertyOptional({ example: 'uuid-of-purchase-unit' })
  @IsUUID()
  @IsOptional()
  purchaseUnitId?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Analgesik dan Antipiretik' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Tablet' })
  @IsString()
  @IsOptional()
  dosageForm?: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ example: '103-90-2' })
  @IsString()
  @IsOptional()
  casNumber?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical Grade' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @IsOptional()
  maxStock?: number;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-manufacturer' })
  @IsUUID()
  @IsOptional()
  manufacturerId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-base-unit' })
  @IsUUID()
  @IsOptional()
  baseUnitId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-stocking-unit' })
  @IsUUID()
  @IsOptional()
  stockingUnitId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-selling-unit' })
  @IsUUID()
  @IsOptional()
  sellingUnitId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-purchase-unit' })
  @IsUUID()
  @IsOptional()
  purchaseUnitId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
