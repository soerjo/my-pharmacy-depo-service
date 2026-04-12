import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '@prisma/client';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 25000.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  supplierId: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsString()
  expectedDate?: string;

  @ApiPropertyOptional({ example: 'Urgent order' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({ enum: PurchaseOrderStatus })
  @IsEnum(PurchaseOrderStatus)
  status: PurchaseOrderStatus;
}
