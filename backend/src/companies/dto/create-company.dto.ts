import { IsString, IsEmail, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsEmail()
  billingEmail: string;

  @IsInt()
  @IsOptional()
  priceTierId?: number;

  @IsString()
  @IsOptional()
  defaultDeliveryTime?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  deliveryBufferMinutes?: number;
}
