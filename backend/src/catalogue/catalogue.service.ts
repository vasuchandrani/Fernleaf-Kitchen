import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

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
  displayOrder: number;
}

export class AddOptionToGroupDto {
  optionId: number;
  displayOrder: number;
}

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async createDish(data: CreateDishDto) {
    const { options, ...dishData } = data;
    try {
      if (!options || options.length === 0) {
        return await this.prisma.dish.create({ data: dishData });
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
        
        return dish;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('A dish with this SKU already exists');
      }
      throw error;
    }
  }

  async findAllDishes(includeInactive = false) {
    return this.prisma.dish.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        kitchenStation: true,
      },
    });
  }

  async findOneDish(id: number) {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: {
        kitchenStation: true,
        optionGroups: {
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

  async createOptionGroup(dishId: number, data: CreateOptionGroupDto) {
    await this.prisma.dish.findUniqueOrThrow({ where: { id: dishId } });
    return this.prisma.optionGroup.create({
      data: {
        dishId,
        name: data.name,
        isRequired: data.isRequired,
        displayOrder: data.displayOrder
      }
    });
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
