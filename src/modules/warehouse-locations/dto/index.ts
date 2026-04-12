import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

class CreateWarehouseLocationDto {
  @ApiProperty({ example: 'WH-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Main Storage Area' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Zone A' })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiPropertyOptional({ example: 'Shelf 3' })
  @IsString()
  @IsOptional()
  shelf?: string;

  @ApiPropertyOptional({ example: 'Bin 12' })
  @IsString()
  @IsOptional()
  bin?: string;

  @ApiProperty({
    enum: LocationType,
    example: LocationType.BULK_STORAGE,
  })
  @IsEnum(LocationType)
  locationType: LocationType;
}

class UpdateWarehouseLocationDto extends PartialType(
  CreateWarehouseLocationDto,
) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export { CreateWarehouseLocationDto, UpdateWarehouseLocationDto };
