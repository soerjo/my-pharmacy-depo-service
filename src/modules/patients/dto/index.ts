import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mrn?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
