import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriceTier } from '@prisma/client';

/**
 * Strategy Pattern for price resolution.
 * Each derivation type implements its own calculation logic.
 */
interface PriceStrategy {
  calculate(basePrice: number, value: number): number;
}

const PRICE_STRATEGIES: Record<string, PriceStrategy> = {
  ADD_AMOUNT: {
    calculate: (base, value) => base + value,
  },
  SUBTRACT_AMOUNT: {
    calculate: (base, value) => Math.max(0, base - value),
  },
  MULTIPLY: {
    calculate: (base, value) => Math.round(base * value),
  },
  MARKUP_PERCENT: {
    calculate: (base, value) => {
      const raw = base + (base * (value / 100));
      // Round up to next 5 cents as per requirement
      return Math.ceil(raw / 5) * 5;
    },
  },
};

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates the custom menu for a specific company by evaluating
   * Active Dishes -> Hidden Dishes -> Manual Price Overrides -> Formula Derived Prices
   */
  async getCompanyMenu(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { priceTier: true, hiddenDishes: true }
    });
    
    if (!company) throw new NotFoundException('Company not found');
    
    const activeDishes = await this.prisma.dish.findMany({
      where: {
        isActive: true,
        catalogueMemberships: company.priceTierId
          ? { some: { tierId: company.priceTierId } }
          : undefined,
      },
      include: {
         prices: { where: { tierId: company.priceTierId || -1 } },
         optionGroups: {
           where: company.priceTierId
             ? { OR: [{ priceTierId: null }, { priceTierId: company.priceTierId }] }
             : { priceTierId: null },
           include: {
             options: {
               include: {
                 option: {
                   include: {
                     prices: { where: { tierId: company.priceTierId || -1 } }
                   }
                 }
               }
             }
           },
           orderBy: { displayOrder: 'asc' }
         }
      }
    });
    
    const hiddenDishIds = new Set(company.hiddenDishes.map(h => h.dishId));
    
    return activeDishes
      .filter(dish => !hiddenDishIds.has(dish.id))
      .map(dish => {
         const overridePrice = dish.prices[0];
         let finalPrice = dish.costPrice;
         
         if (overridePrice) {
           finalPrice = overridePrice.price;
         } else if (company.priceTier) {
           finalPrice = this.calculateDerivedPrice(dish.costPrice, company.priceTier);
         }

         const groupsByName = new Map<string, typeof dish.optionGroups[number]>();
         for (const group of dish.optionGroups) {
           const existing = groupsByName.get(group.name);
           if (!existing || (group.priceTierId === company.priceTierId && group.priceTierId !== null)) {
             groupsByName.set(group.name, group);
           }
         }
         const optionGroups = [...groupsByName.values()].map(og => ({
           id: og.id,
           name: og.name,
           isRequired: og.isRequired,
           options: og.options.sort((a,b) => a.displayOrder - b.displayOrder).filter(ogo => ogo.option.isActive).map(ogo => {
             const opt = ogo.option;
             const optOverride = opt.prices[0];
             let optFinalPrice = opt.costPrice;
             if (optOverride) {
               optFinalPrice = optOverride.price;
             }
             return {
               id: opt.id,
               name: opt.name,
               finalPrice: optFinalPrice
             };
           })
         }));
         
         // Remove the prices array from the final payload to keep it clean
         const { prices, optionGroups: _rawOg, ...dishData } = dish;
         return {
           ...dishData,
           finalPrice,
           optionGroups
         };
      });
  }

  /**
   * Strategy Pattern: resolve price using the tier's derivation type.
   */
  calculateDerivedPrice(basePrice: number, tier: PriceTier): number {
    if (!tier.derivationType || tier.derivationValue === null || tier.derivationValue === undefined) {
      return basePrice;
    }

    const strategy = PRICE_STRATEGIES[tier.derivationType];
    if (!strategy) return basePrice;

    return strategy.calculate(basePrice, tier.derivationValue);
  }

  // ====== Tier Management ======

  async getTiers() {
    return this.prisma.priceTier.findMany({
      include: {
        _count: { select: { companies: true, dishPrices: true } }
      }
    });
  }

  async createTier(data: { name: string; isDefault?: boolean; derivationType?: string; derivationValue?: number }) {
    if (data.isDefault) {
      throw new ConflictException('The default catalogue is created automatically and cannot be duplicated');
    }
    const defaultTier = await this.prisma.priceTier.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    return this.prisma.$transaction(async tx => {
      const tier = await tx.priceTier.create({
        data: {
          name: data.name.trim(),
          isDefault: false,
          derivedFromTierId: defaultTier?.id,
          derivationType: data.derivationType || null,
          derivationValue: data.derivationValue ?? null,
        },
      });
      if (defaultTier) {
        const dishes = await tx.priceTierDish.findMany({
          where: { tierId: defaultTier.id },
          select: { dishId: true },
        });
        if (dishes.length) {
          await tx.priceTierDish.createMany({
            data: dishes.map(dish => ({ tierId: tier.id, dishId: dish.dishId })),
          });
        }
      }
      return tier;
    });
  }

  async updateTier(id: number, data: { name?: string; derivationType?: string; derivationValue?: number }) {
    const tier = await this.prisma.priceTier.findUnique({ where: { id } });
    if (!tier) throw new NotFoundException('Catalogue not found');
    const name = data.name?.trim();
    if (name === '') throw new ConflictException('Catalogue name is required');
    return this.prisma.priceTier.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(data.derivationType !== undefined ? { derivationType: data.derivationType || null } : {}),
        ...(data.derivationValue !== undefined ? { derivationValue: data.derivationValue } : {}),
      },
    });
  }

  async deleteTier(id: number) {
    const tier = await this.prisma.priceTier.findUnique({ where: { id } });
    if (!tier) throw new NotFoundException('Catalogue not found');
    if (tier.isDefault) throw new ConflictException('The default catalogue cannot be deleted');
    const company = await this.prisma.company.findFirst({ where: { priceTierId: id }, select: { id: true } });
    if (company) throw new ConflictException('Reassign companies before deleting this catalogue');
    return this.prisma.priceTier.delete({ where: { id } });
  }

  /**
   * Prototype Pattern: Clone a tier to create a new catalogue.
   * Copies all dish price overrides from the source and optionally applies a derivation rule.
   */
  async cloneTier(sourceTierId: number, data: { name: string; derivationType?: string; derivationValue?: number }) {
    const source = await this.prisma.priceTier.findUnique({
      where: { id: sourceTierId },
      include: { dishPrices: true, optionPrices: true },
    });
    if (!source) throw new NotFoundException('Source tier not found');

    // Check name uniqueness
    const existing = await this.prisma.priceTier.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException(`A tier named "${data.name}" already exists`);

    return this.prisma.$transaction(async (tx) => {
      // Create the new tier
      const newTier = await tx.priceTier.create({
        data: {
          name: data.name,
          isDefault: false,
          derivedFromTierId: sourceTierId,
          derivationType: data.derivationType || null,
          derivationValue: data.derivationValue || null,
        },
      });

      // Clone dish price overrides from source
      if (source.dishPrices.length > 0) {
        await tx.dishPrice.createMany({
          data: source.dishPrices.map(dp => ({
            dishId: dp.dishId,
            tierId: newTier.id,
            price: data.derivationType
              ? this.calculateDerivedPrice(dp.price, { ...newTier, derivationType: data.derivationType, derivationValue: data.derivationValue ?? 0 } as any)
              : dp.price,
            isOverride: dp.isOverride,
          })),
        });
      }

      // Clone option price overrides from source
      if (source.optionPrices.length > 0) {
        await tx.optionPrice.createMany({
          data: source.optionPrices.map(op => ({
            optionId: op.optionId,
            tierId: newTier.id,
            price: data.derivationType
              ? this.calculateDerivedPrice(op.price, { ...newTier, derivationType: data.derivationType, derivationValue: data.derivationValue ?? 0 } as any)
              : op.price,
            isOverride: op.isOverride,
          })),
        });
      }

      const sourceDishes = await tx.priceTierDish.findMany({ where: { tierId: sourceTierId } });
      if (sourceDishes.length > 0) {
        await tx.priceTierDish.createMany({
          data: sourceDishes.map(item => ({ tierId: newTier.id, dishId: item.dishId })),
        });
      }

      return newTier;
    });
  }

  /**
   * Get all dishes with their computed prices for a specific tier.
   * Used by the Catalogue UI to show the full menu for a tier.
   */
  async getTierDishes(tierId: number) {
    const tier = await this.prisma.priceTier.findUnique({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Tier not found');

    const dishes = await this.prisma.dish.findMany({
      where: { catalogueMemberships: { some: { tierId } } },
      include: {
        kitchenStation: true,
        category: true,
        prices: { where: { tierId } },
        optionGroups: {
          include: {
            options: {
              include: {
                option: {
                  include: {
                    prices: { where: { tierId } },
                  },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return dishes.map(dish => {
      const override = dish.prices[0];
      let finalPrice = dish.costPrice;
      if (override) {
        finalPrice = override.price;
      } else {
        finalPrice = this.calculateDerivedPrice(dish.costPrice, tier);
      }

      const optionGroups = dish.optionGroups.map(og => ({
        id: og.id,
        name: og.name,
        isRequired: og.isRequired,
        displayOrder: og.displayOrder,
        options: og.options
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(ogo => {
            const opt = ogo.option;
            const optOverride = opt.prices[0];
            let optFinalPrice = opt.costPrice;
            if (optOverride) optFinalPrice = optOverride.price;
            else optFinalPrice = this.calculateDerivedPrice(opt.costPrice, tier);
            return {
              id: opt.id,
              name: opt.name,
              costPrice: opt.costPrice,
              isActive: opt.isActive,
              finalPrice: optFinalPrice,
              hasOverride: !!optOverride,
            };
          }),
      }));

      const { prices, optionGroups: _raw, ...dishData } = dish;
      return {
        ...dishData,
        finalPrice,
        hasOverride: !!override,
        optionGroups,
      };
    });
  }

  /**
   * Set or update a dish price override for a specific tier.
   */
  async setDishPrice(tierId: number, dishId: number, price: number) {
    return this.prisma.dishPrice.upsert({
      where: { dishId_tierId: { dishId, tierId } },
      create: { dishId, tierId, price, isOverride: true },
      update: { price, isOverride: true },
    });
  }

  /**
   * Remove a manual price override (revert to derived/default).
   */
  async removeDishPriceOverride(tierId: number, dishId: number) {
    try {
      return await this.prisma.dishPrice.delete({
        where: { dishId_tierId: { dishId, tierId } },
      });
    } catch {
      return { message: 'No override to remove' };
    }
  }

  /**
   * Apply a bulk price rule to all dishes in a tier.
   * E.g., "increase all prices by 5%" or "set all to cost * 2.4"
   */
  async applyBulkPriceRule(
    tierId: number,
    rule: { type: string; value: number },
  ) {
    const tier = await this.prisma.priceTier.findUnique({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Tier not found');

    // Update the tier's derivation rule
    await this.prisma.priceTier.update({
      where: { id: tierId },
      data: {
        derivationType: rule.type,
        derivationValue: rule.value,
      },
    });

    // Clear all non-override prices so they re-derive
    await this.prisma.dishPrice.deleteMany({
      where: { tierId, isOverride: false },
    });
    await this.prisma.optionPrice.deleteMany({
      where: { tierId, isOverride: false },
    });

    return { success: true, message: `Applied ${rule.type} rule with value ${rule.value}` };
  }
}
