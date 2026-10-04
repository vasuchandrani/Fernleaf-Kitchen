import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { BulkCreateEmployeesDto, CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async createCompany(data: CreateCompanyDto) {
    const priceTierId = data.priceTierId ?? (
      await this.prisma.priceTier.findFirst({ where: { isDefault: true }, select: { id: true } })
    )?.id;
    return this.prisma.company.create({ data: { ...data, priceTierId } });
  }

  async findAllCompanies() {
    return this.prisma.company.findMany({
      include: { priceTier: true },
    });
  }

  async updateCompany(id: number, data: Partial<CreateCompanyDto>) {
    await this.getCompany(id);
    if (data.priceTierId !== undefined) {
      const tier = await this.prisma.priceTier.findUnique({ where: { id: data.priceTierId } });
      if (!tier) throw new NotFoundException('Catalogue not found');
    }
    return this.prisma.company.update({ where: { id }, data });
  }

  async deleteCompany(id: number) {
    await this.getCompany(id);
    return this.prisma.$transaction(async tx => {
      const employees = await tx.employee.findMany({ where: { companyId: id }, select: { id: true } });
      const employeeIds = employees.map(employee => employee.id);
      const orders = await tx.order.findMany({ where: { employeeId: { in: employeeIds } }, select: { id: true } });
      const orderIds = orders.map(order => order.id);
      const lines = await tx.orderLine.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
      const lineIds = lines.map(line => line.id);
      const combinations = await tx.orderCombination.findMany({ where: { orderLineId: { in: lineIds } }, select: { id: true } });
      await tx.combinationOption.deleteMany({ where: { combinationId: { in: combinations.map(item => item.id) } } });
      await tx.orderCombination.deleteMany({ where: { id: { in: combinations.map(item => item.id) } } });
      await tx.orderLine.deleteMany({ where: { id: { in: lineIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      await tx.employee.deleteMany({ where: { companyId: id } });
      await tx.companyAddress.deleteMany({ where: { companyId: id } });
      await tx.companyHiddenDish.deleteMany({ where: { companyId: id } });
      return tx.company.delete({ where: { id } });
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

  async updateEmployee(companyId: number, employeeId: number, data: Partial<CreateEmployeeDto>) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException('Employee not found');
    try {
      return await this.prisma.employee.update({ where: { id: employeeId }, data });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('Employee with this email already exists');
      throw error;
    }
  }

  async deleteEmployee(companyId: number, employeeId: number) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException('Employee not found');
    const order = await this.prisma.order.findFirst({ where: { employeeId } });
    if (order) throw new ConflictException('Employees with orders cannot be deleted');
    return this.prisma.employee.delete({ where: { id: employeeId } });
  }
}
