import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
