import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { BedStatus } from '@prisma/client';

export class CreateBedDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bedNumber: string;

  @ApiPropertyOptional({ enum: BedStatus })
  @IsEnum(BedStatus)
  @IsOptional()
  status?: BedStatus;
}

export class UpdateBedDto extends PartialType(CreateBedDto) {
  @ApiPropertyOptional({ enum: BedStatus })
  @IsEnum(BedStatus)
  @IsOptional()
  status?: BedStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
