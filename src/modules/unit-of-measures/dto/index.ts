import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUnitOfMeasureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  abbreviation?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isBase?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  baseUnitId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsOptional()
  conversionFactor?: number;
}

export class UpdateUnitOfMeasureDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  abbreviation?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsOptional()
  conversionFactor?: number;
}
