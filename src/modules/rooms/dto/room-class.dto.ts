import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CreateRoomClassDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  basePrice?: number;

  constructor(partial?: Partial<CreateRoomClassDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateRoomClassDto extends PartialType(CreateRoomClassDto) {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  active?: boolean;
}
