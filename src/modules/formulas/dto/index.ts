import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormulaIngredientDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  unitOfMeasureId: string;

  @ApiPropertyOptional({ example: 'Active ingredient' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateFormulaDto {
  @ApiProperty({ example: 'FML-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Hydrocortisone Cream 1%' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Topical corticosteroid cream' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Cream' })
  @IsString()
  @IsOptional()
  dosageForm?: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  totalYield: number;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  yieldUnitId: string;

  @ApiPropertyOptional({ example: 'Mix all ingredients thoroughly' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ type: [CreateFormulaIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateFormulaIngredientDto)
  ingredients: CreateFormulaIngredientDto[];
}

export class UpdateFormulaDto extends PartialType(CreateFormulaDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
