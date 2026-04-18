import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  code: string;

  @ApiProperty()
  @IsEnum(LocationType)
  @IsNotEmpty()
  type: LocationType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}
