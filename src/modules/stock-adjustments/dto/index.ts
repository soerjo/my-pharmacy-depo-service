import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  batchId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ description: 'Can be positive or negative' })
  @IsInt()
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
