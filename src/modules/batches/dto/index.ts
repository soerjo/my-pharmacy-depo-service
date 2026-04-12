import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ description: 'ISO date string' })
  @IsDateString()
  expirationDate: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  cost: number;

  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  manufacturerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  compoundingBatchId?: string;
}

export class UpdateBatchDto {
  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
