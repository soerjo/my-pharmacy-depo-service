import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OutboundShipmentStatus } from '@prisma/client';

export class CreateOutboundShipmentItemDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  batchId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  locationId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOutboundShipmentDto {
  @ApiProperty({ example: 'Farmasi Medika' })
  @IsString()
  destination: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 1, Jakarta' })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiPropertyOptional({ example: 'Urgent shipment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOutboundShipmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateOutboundShipmentItemDto)
  items: CreateOutboundShipmentItemDto[];
}

export class UpdateOutboundStatusDto {
  @ApiProperty({ enum: OutboundShipmentStatus })
  @IsEnum(OutboundShipmentStatus)
  status: OutboundShipmentStatus;
}
