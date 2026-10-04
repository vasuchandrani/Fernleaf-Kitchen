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
}
