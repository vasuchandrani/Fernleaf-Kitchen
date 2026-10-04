import { IsString, IsInt, IsOptional, IsEnum, Min, IsBoolean } from 'class-validator';

export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsEnum(['HOT', 'COLD'])
  @IsOptional()
  temperature?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  minOrderQty?: number;

  @IsInt()
  @IsOptional()
  kitchenStationId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
