import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompoundingStatus } from '@prisma/client';

export class CreateCompoundingBatchMaterialDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.0001)
  quantityUsed: number;
}

export class CreateCompoundingBatchDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  formulaId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '2026-12-31' })
  @IsISO8601()
  expirationDate: string;

  @ApiPropertyOptional({ example: 'Special instructions' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateCompoundingBatchMaterialDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateCompoundingBatchMaterialDto)
  materials: CreateCompoundingBatchMaterialDto[];
}

export class UpdateCompoundingStatusDto {
  @ApiProperty({ enum: CompoundingStatus })
  @IsEnum(CompoundingStatus)
  status: CompoundingStatus;
}
