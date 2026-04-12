import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TransferStatus } from '@prisma/client';

export class CreateTransferDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  batchId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  fromLocationId: string;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  toLocationId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Urgent transfer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTransferStatusDto {
  @ApiProperty({ enum: TransferStatus })
  @IsEnum(TransferStatus)
  status: TransferStatus;
}
