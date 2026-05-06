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
  IsBoolean,
  IsDateString,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/swagger';
import { DispenseOrderStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class CreateDispenseOrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  drugId: string;

  @ApiProperty()
  @IsInt()
  // @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateDispenseOrderDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsNotEmpty()
  admissionId: string;

  @ApiPropertyOptional({ description: 'Admission date (ISO 8601)' })
  @IsDate()
  @IsOptional()
  admissionDate?: Date;

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
  @ApiProperty({ enum: DispenseOrderStatus })
  @IsOptional()
  @IsEnum(DispenseOrderStatus)
  status: DispenseOrderStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class AddDispenseOrderItemDto extends CreateDispenseOrderItemDto {}

export class UpdateDispenseOrderItemDto {
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

export class CancelDispenseOrderDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  reason: string;
}

export class DispenseOrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DispenseOrderStatus })
  @IsEnum(DispenseOrderStatus)
  @IsOptional()
  status?: DispenseOrderStatus;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string = new Date().toISOString().split('T')[0];

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string = new Date().toISOString().split('T')[0];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Comma-separated list of product IDs',
  })
  @Transform(({ value }) =>
    value ? value.split(',').map((id: string) => id.trim()) : undefined,
  )
  @IsArray()
  @IsOptional()
  ids?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()  
  @Transform(({ value }) => {
    return value === 'true' || value === true
  })
  isExport?: boolean = false;

}
