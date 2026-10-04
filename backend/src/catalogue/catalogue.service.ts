import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { Prisma } from '@prisma/client';

export class CreateOptionDto {
  name: string;
  costPrice: number;
}

export class CreateStationDto {
  name: string;
}

export class CreateOptionGroupDto {
  name: string;
  isRequired: boolean;
  displayOrder?: number;
  tierId?: number;
}

export class AddOptionToGroupDto {
  optionId: number;
  displayOrder: number;
}

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async createDish(data: CreateDishDto) {
    const { options, tierId, ...dishData } = data;
    try {
      const [category, station] = await Promise.all([
        this.prisma.category.findUnique({ where: { id: data.categoryId } }),
        data.kitchenStationId
          ? this.prisma.kitchenStation.findUnique({ where: { id: data.kitchenStationId } })
          : Promise.resolve(null),
      ]);
      if (!category) throw new NotFoundException('Category not found');
      if (!options || options.length === 0) {
        const dish = await this.prisma.dish.create({ data: dishData });
        await this.attachDishToCatalogues(dish.id, tierId);
        return dish;
      }

      return await this.prisma.$transaction(async (tx) => {
        const dish = await tx.dish.create({ data: dishData });
        
        const group = await tx.optionGroup.create({
          data: {
            dishId: dish.id,
            name: 'Options',
            isRequired: false,
            displayOrder: 1
          }
        });

        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          let globalOption = await tx.option.findFirst({
            where: { name: opt.name, costPrice: opt.price }
          });
          if (!globalOption) {
            globalOption = await tx.option.create({
              data: { name: opt.name, costPrice: opt.price, isActive: true }
            });
          }
          
          await tx.optionGroupOption.create({
            data: {
              optionGroupId: group.id,
              optionId: globalOption.id,
              displayOrder: i + 1
            }
          });
        }
        
        await this.attachDishToCatalogues(dish.id, tierId, tx);
        return dish;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('A dish with this SKU already exists');
      }

      throw error;
    }
  }

  private async attachDishToCatalogues(
    dishId: number,
    tierId?: number,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    if (tierId) {
      const tier = await client.priceTier.findUnique({ where: { id: tierId } });
      if (!tier) throw new NotFoundException('Catalogue not found');
      const tiers = tier.isDefault
        ? await client.priceTier.findMany({ select: { id: true } })
        : [{ id: tierId }];
      await client.priceTierDish.createMany({
        data: tiers.map((item: { id: number }) => ({ tierId: item.id, dishId })),
        skipDuplicates: true,
      });
      return;
    }
    const defaultTier = await client.priceTier.findFirst({ where: { isDefault: true } });
    if (defaultTier) {
      const tiers = await client.priceTier.findMany({ select: { id: true } });
      await client.priceTierDish.createMany({
        data: tiers.map((item: { id: number }) => ({ tierId: item.id, dishId })),
        skipDuplicates: true,
      });
    }
  }

  async findAllDishes(includeInactive = false) {
    return this.prisma.dish.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        kitchenStation: true,
        category: true,
      },
    });
  }

  async findOneDish(id: number, tierId?: number) {
    const tier = tierId ? await this.prisma.priceTier.findUnique({ where: { id: tierId } }) : null;
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: {
        kitchenStation: true,
        optionGroups: {
          where: tierId ? { OR: [{ priceTierId: null }, { priceTierId: tierId }] } : undefined,
          include: {
            options: {
              include: {
                option: true,
              }
            }
          }
        }
      },
    });

    if (!dish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }

    return dish;
  }

  async updateDish(id: number, data: UpdateDishDto) {
    await this.findOneDish(id); // Ensure exists
    
    try {
      return await this.prisma.dish.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('A dish with this SKU already exists');
      }
      throw error;
    }
  }

  async deactivateDish(id: number) {
    await this.findOneDish(id); // Ensure exists
    
    return this.prisma.dish.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createOption(data: CreateOptionDto) {
    return this.prisma.option.create({ data: { ...data, isActive: true } });
  }

  async findAllOptions(includeInactive = false) {
    return this.prisma.option.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async updateOption(id: number, data: Partial<CreateOptionDto>) {
    await this.prisma.option.findUniqueOrThrow({ where: { id } });
    return this.prisma.option.update({ where: { id }, data });
  }

  async deactivateOption(id: number) {
    await this.prisma.option.findUniqueOrThrow({ where: { id } });
    return this.prisma.option.update({ where: { id }, data: { isActive: false } });
  }

  async createStation(data: CreateStationDto) {
    return this.prisma.kitchenStation.create({ data });
  }

  async findAllStations() {
    return this.prisma.kitchenStation.findMany();
  }

  async createCategory(data: { name: string }) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('Category name is required');
    try {
      return await this.prisma.category.create({ data: { name } });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('A category with this name already exists');
      throw error;
    }
  }

  async findAllCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async createOptionGroup(dishId: number, data: CreateOptionGroupDto) {
    await this.prisma.dish.findUniqueOrThrow({ where: { id: dishId } });
    const tier = data.tierId
      ? await this.prisma.priceTier.findUnique({ where: { id: data.tierId } })
      : null;
    if (data.tierId && !tier) throw new NotFoundException('Catalogue not found');
    return this.prisma.optionGroup.create({
      data: {
        dishId,
        name: data.name,
        isRequired: data.isRequired,
        displayOrder: data.displayOrder ?? 1,
        priceTierId: tier?.isDefault ? null : (data.tierId ?? null),
      }
    });
  }

  async deleteOptionGroup(dishId: number, groupId: number) {
    const group = await this.prisma.optionGroup.findFirst({
      where: { id: groupId, dishId },
    });
    if (!group) {
      throw new NotFoundException(`Option group ${groupId} does not belong to dish ${dishId}`);
    }

    await this.prisma.$transaction([
      this.prisma.optionGroupOption.deleteMany({ where: { optionGroupId: groupId } }),
      this.prisma.optionGroup.delete({ where: { id: groupId } }),
    ]);

    return { success: true };
  }

  async addOptionToGroup(dishId: number, groupId: number, data: AddOptionToGroupDto) {
    const group = await this.prisma.optionGroup.findFirst({
      where: { id: groupId, dishId },
    });
    if (!group) {
      throw new NotFoundException(`Option group ${groupId} does not belong to dish ${dishId}`);
    }
    await this.prisma.option.findUniqueOrThrow({ where: { id: data.optionId } });
    const existing = await this.prisma.optionGroupOption.findFirst({
      where: { optionGroupId: groupId, optionId: data.optionId },
    });
    if (existing) {
      throw new ConflictException('This option is already attached to the group');
    }
    return this.prisma.optionGroupOption.create({
      data: {
        optionGroupId: groupId,
        optionId: data.optionId,
        displayOrder: data.displayOrder
      }
    });
  }
}
