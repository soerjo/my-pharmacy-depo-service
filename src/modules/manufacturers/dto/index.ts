import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateManufacturerDto {
  @ApiProperty({ example: 'MFR-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'PT Farmasi Indonesia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'info@farmasi.co.id' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 1, Jakarta' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateManufacturerDto extends PartialType(CreateManufacturerDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
