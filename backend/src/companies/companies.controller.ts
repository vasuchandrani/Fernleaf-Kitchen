import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { BulkCreateEmployeesDto, CreateEmployeeDto } from './dto/create-employee.dto';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @RequirePermissions('companies.write')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(dto);
  }

  @Get()
  @RequirePermissions('companies.read')
  findAll() {
    return this.companiesService.findAllCompanies();
  }

  @Get(':id')
  @RequirePermissions('companies.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getCompany(id);
  }

  @Post(':id/employees')
  @RequirePermissions('companies.write')
  addEmployee(
    @Param('id', ParseIntPipe) companyId: number,
    @Body() dto: CreateEmployeeDto
  ) {
    return this.companiesService.addEmployee(companyId, dto);
  }

  @Post(':id/employees/bulk')
  @RequirePermissions('companies.write')
  bulkAddEmployees(
    @Param('id', ParseIntPipe) companyId: number,
    @Body() dto: BulkCreateEmployeesDto
  ) {
    return this.companiesService.bulkAddEmployees(companyId, dto);
  }
}
