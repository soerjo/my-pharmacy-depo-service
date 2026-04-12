import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundShipmentStatus } from '@prisma/client';

export class CreateInboundShipmentItemDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  locationId: string;
}

export class CreateInboundShipmentDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsString()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  receivedBy: string;

  @ApiPropertyOptional({ example: 'Received in good condition' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateInboundShipmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateInboundShipmentItemDto)
  items: CreateInboundShipmentItemDto[];
}

export class UpdateInboundStatusDto {
  @ApiProperty({ enum: InboundShipmentStatus })
  @IsEnum(InboundShipmentStatus)
  status: InboundShipmentStatus;
}
