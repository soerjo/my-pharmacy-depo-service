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
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

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
  roomId?: string;

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

export class QueryAdmissionDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by patient name or admission number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by admission start date (inclusive, ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by admission end date (inclusive, ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by admission status',
    enum: AdmissionStatus,
  })
  @IsOptional()
  @IsEnum(AdmissionStatus)
  status?: AdmissionStatus;
}
