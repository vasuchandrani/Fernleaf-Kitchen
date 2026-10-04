import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const records = await this.prisma.setting.findMany();
    const settings: Record<string, any> = {};
    records.forEach(r => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch (e) {
        settings[r.key] = r.value;
      }
    });
    return settings;
  }

  async updateAll(data: Record<string, any>) {
    const promises = Object.entries(data).map(([key, value]) => {
      return this.prisma.setting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
    });
    await Promise.all(promises);
    return this.getAll();
  }

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany();
  }

  async createRole(name: string, description: string, permissionIds: number[]) {
    return this.prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map(id => ({ permissionId: id }))
        }
      },
      include: {
        permissions: { include: { permission: true } }
      }
    });
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]) {
    // Delete existing mapping
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    // Add new mapping
    if (permissionIds && permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map(id => ({ roleId, permissionId: id }))
      });
    }
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } }
    });
  }
}
