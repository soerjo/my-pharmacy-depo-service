import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';

export class CreateAdmissionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  admissionDate: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  wardId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAdmissionDto extends PartialType(CreateAdmissionDto) {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dischargeDate?: string;

  @ApiPropertyOptional()
  @IsEnum(AdmissionStatus)
  @IsOptional()
  status?: AdmissionStatus;
}
