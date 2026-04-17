import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/swagger';
import { DispenseType } from '@prisma/client';

export class CreateDispenseOrderItemDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  drugId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateDispenseOrderDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  admissionId?: string;

  @ApiProperty({ enum: DispenseType })
  @IsEnum(DispenseType)
  @IsNotEmpty()
  type: DispenseType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateDispenseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDispenseOrderItemDto)
  items: CreateDispenseOrderItemDto[];
}

export class UpdateDispenseOrderDto extends PartialType(
  OmitType(CreateDispenseOrderDto, [] as const),
) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class AddDispenseOrderItemDto extends CreateDispenseOrderItemDto {}

export class UpdateDispenseOrderItemDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  drugId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  drugName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CancelDispenseOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
