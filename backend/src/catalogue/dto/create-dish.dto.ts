import { IsString, IsInt, IsOptional, IsEnum, Min, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DishOptionInlineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  price: number;
}

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsEnum(['HOT', 'COLD'])
  @IsOptional()
  temperature: string;

  @IsInt()
  @Min(0)
  costPrice: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  minOrderQty?: number;

  @IsInt()
  @IsOptional()
  kitchenStationId?: number;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsEnum(['VEG', 'NON_VEG'])
  dietaryType: string;

  @IsOptional()
  @IsInt()
  tierId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishOptionInlineDto)
  @IsOptional()
  options?: DishOptionInlineDto[];
}
