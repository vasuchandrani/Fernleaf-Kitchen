import { IsString, IsEmail, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

export class BulkCreateEmployeesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeDto)
  employees: CreateEmployeeDto[];
}
