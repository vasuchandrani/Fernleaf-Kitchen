import { IsInt, IsString, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderLineOptionDto {
  @IsString()
  optionGroupName: string;

  @IsString()
  optionName: string;

  @IsInt()
  optionPrice: number;
}

export class CreateOrderCombinationDto {
  @IsInt()
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineOptionDto)
  options: CreateOrderLineOptionDto[];
}

export class CreateOrderLineDto {
  @IsInt()
  dishId: number;

  @IsString()
  dishName: string;

  @IsString()
  dishSku: string;

  @IsInt()
  unitPrice: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderCombinationDto)
  combinations: CreateOrderCombinationDto[];
}

export class CreateOrderDto {
  @IsInt()
  employeeId: number;

  @IsDateString()
  deliveryDate: string;

  @IsString()
  deliveryTime: string;

  @IsString()
  status: string; // DRAFT or PLACED usually

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines: CreateOrderLineDto[];
}
