/**
 * Prototype Pattern for Catalogue/Price Tier creation.
 * 
 * The Prototype pattern allows creating new catalogue tiers by cloning an
 * existing one and applying transformations (price rules). This avoids
 * coupling the creation logic to specific tier configurations.
 * 
 * Usage:
 *   const prototype = new CataloguePrototype(defaultTier);
 *   const newTier = prototype.clone('Enterprise', { type: 'MARKUP_PERCENT', value: 15 });
 *   // → Creates a new tier with all prices 15% higher than default
 * 
 * This follows the Open/Closed Principle:
 *  - Open for extension (new price strategies can be added)
 *  - Closed for modification (existing strategies don't change)
 */

export interface PriceRule {
  type: 'MARKUP_PERCENT' | 'MULTIPLY' | 'ADD_AMOUNT' | 'SUBTRACT_AMOUNT';
  value: number;
}

export interface TierData {
  id: number;
  name: string;
  isDefault: boolean;
  derivationType?: string | null;
  derivationValue?: number | null;
}

/**
 * Strategy Pattern: maps rule types to price calculation functions.
 * Each strategy encapsulates a specific pricing algorithm.
 */
const PRICE_STRATEGIES: Record<string, (base: number, value: number) => number> = {
  MARKUP_PERCENT: (base, value) => Math.ceil((base + base * (value / 100)) / 5) * 5,
  MULTIPLY: (base, value) => Math.round(base * value),
  ADD_AMOUNT: (base, value) => base + value,
  SUBTRACT_AMOUNT: (base, value) => Math.max(0, base - value),
};

/**
 * CataloguePrototype: enables cloning a tier configuration.
 */
export class CataloguePrototype {
  constructor(private source: TierData) {}

  /**
   * Creates a clone specification that can be sent to the backend.
   */
  clone(newName: string, rule?: PriceRule): { name: string; derivationType?: string; derivationValue?: number } {
    return {
      name: newName,
      derivationType: rule?.type,
      derivationValue: rule?.value,
    };
  }

  /**
   * Preview: compute what a price would be under a given rule.
   * Useful for showing price previews in the UI before committing.
   */
  previewPrice(basePrice: number, rule: PriceRule): number {
    const strategy = PRICE_STRATEGIES[rule.type];
    if (!strategy) return basePrice;
    return strategy(basePrice, rule.value);
  }

  /**
   * Get a human-readable description of a price rule.
   */
  static describeRule(rule: PriceRule): string {
    switch (rule.type) {
      case 'MARKUP_PERCENT':
        return `+${rule.value}% from base`;
      case 'MULTIPLY':
        return `×${rule.value} of base`;
      case 'ADD_AMOUNT':
        return `+$${(rule.value / 100).toFixed(2)} per item`;
      case 'SUBTRACT_AMOUNT':
        return `-$${(rule.value / 100).toFixed(2)} per item`;
      default:
        return 'Custom rule';
    }
  }

  getSource(): TierData {
    return { ...this.source };
  }
}
