import { Controller, Get, Param, ParseIntPipe, Post, Patch, Delete, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('menu/:companyId')
  @RequirePermissions('order.create')
  getCompanyMenu(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.pricingService.getCompanyMenu(companyId);
  }

  // ====== Tier/Catalogue Management ======

  @Get('tiers')
  @RequirePermissions('catalogue.read')
  getTiers() {
    return this.pricingService.getTiers();
  }

  @Post('tiers')
  @RequirePermissions('catalogue.write')
  createTier(@Body() data: { name: string; isDefault?: boolean; derivationType?: string; derivationValue?: number }) {
    return this.pricingService.createTier(data);
  }

  @Patch('tiers/:id')
  @RequirePermissions('catalogue.write')
  updateTier(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.pricingService.updateTier(id, data);
  }

  @Delete('tiers/:id')
  @RequirePermissions('catalogue.write')
  deleteTier(@Param('id', ParseIntPipe) id: number) {
    return this.pricingService.deleteTier(id);
  }

  /**
   * Prototype Pattern: Clone a tier to create a new catalogue version.
   */
  @Post('tiers/:id/clone')
  @RequirePermissions('catalogue.write')
  cloneTier(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { name: string; derivationType?: string; derivationValue?: number },
  ) {
    return this.pricingService.cloneTier(id, data);
  }

  /**
   * Get all dishes with their computed prices for a tier.
   */
  @Get('tiers/:id/dishes')
  @RequirePermissions('catalogue.read')
  getTierDishes(@Param('id', ParseIntPipe) id: number) {
    return this.pricingService.getTierDishes(id);
  }

  /**
   * Set or update a dish price override for a tier.
   */
  @Patch('tiers/:tierId/dishes/:dishId/price')
  @RequirePermissions('catalogue.write')
  setDishPrice(
    @Param('tierId', ParseIntPipe) tierId: number,
    @Param('dishId', ParseIntPipe) dishId: number,
    @Body('price') price: number,
  ) {
    return this.pricingService.setDishPrice(tierId, dishId, price);
  }

  /**
   * Remove a dish price override (revert to derived).
   */
  @Delete('tiers/:tierId/dishes/:dishId/price')
  @RequirePermissions('catalogue.write')
  removeDishPriceOverride(
    @Param('tierId', ParseIntPipe) tierId: number,
    @Param('dishId', ParseIntPipe) dishId: number,
  ) {
    return this.pricingService.removeDishPriceOverride(tierId, dishId);
  }

  /**
   * Apply a bulk price rule to all dishes in a tier.
   */
  @Post('tiers/:id/apply-rule')
  @RequirePermissions('catalogue.write')
  applyBulkPriceRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() rule: { type: string; value: number },
  ) {
    return this.pricingService.applyBulkPriceRule(id, rule);
  }
}
