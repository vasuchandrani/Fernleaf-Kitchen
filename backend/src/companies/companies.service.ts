import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { BulkCreateEmployeesDto, CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async createCompany(data: CreateCompanyDto) {
    return this.prisma.company.create({ data });
  }

  async findAllCompanies() {
    return this.prisma.company.findMany({
      include: { priceTier: true },
    });
  }

  async getCompany(id: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        employees: true,
        addresses: true,
        priceTier: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return company;
  }

  async addEmployee(companyId: number, data: CreateEmployeeDto) {
    await this.getCompany(companyId); // Ensure company exists

    try {
      return await this.prisma.employee.create({
        data: {
          ...data,
          companyId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Employee with this email already exists');
      }
      throw error;
    }
  }

  async bulkAddEmployees(companyId: number, data: BulkCreateEmployeesDto) {
    await this.getCompany(companyId);

    // Using createMany for bulk insert (skipDuplicates handles existing emails gracefully)
    const result = await this.prisma.employee.createMany({
      data: data.employees.map(emp => ({
        ...emp,
        companyId,
      })),
      skipDuplicates: true, 
    });

    return {
      message: `Successfully imported ${result.count} employees`,
      count: result.count
    };
  }
}
