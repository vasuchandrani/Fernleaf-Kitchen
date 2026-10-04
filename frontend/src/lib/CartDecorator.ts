/**
 * Decorator Pattern for Dishes and Options.
 * 
 * The Decorator pattern allows adding options (add-ons) to a dish dynamically,
 * where each decorator wraps the previous item and adds its own price contribution.
 * 
 * This follows the Open/Closed Principle (SOLID):
 *  - Open for extension (new decorators can be added)
 *  - Closed for modification (existing classes don't change)
 */

/** Interface Segregation: minimal contract for a cart item */
export interface ICartItem {
  getPrice(): number;
  getDescription(): string;
  getOptions(): CartOption[];
  getSku(): string;
  getDishId(): number;
}

export interface CartOption {
  groupName: string;
  optionName: string;
  price: number;
}

/**
 * Concrete Component: The base dish without any options.
 */
export class BaseDish implements ICartItem {
  constructor(private dish: { id: number; name: string; sku: string; finalPrice: number }) {}

  getPrice(): number {
    return this.dish.finalPrice;
  }

  getDescription(): string {
    return this.dish.name;
  }

  getOptions(): CartOption[] {
    return [];
  }

  getSku(): string {
    return this.dish.sku;
  }

  getDishId(): number {
    return this.dish.id;
  }
}

/**
 * Decorator: Wraps an ICartItem and adds an option's price and description.
 * Each DishOptionDecorator represents one selected option (add-on).
 */
export class DishOptionDecorator implements ICartItem {
  constructor(
    protected wrapped: ICartItem,
    private option: CartOption,
  ) {}

  getPrice(): number {
    return this.wrapped.getPrice() + this.option.price;
  }

  getDescription(): string {
    return `${this.wrapped.getDescription()} + ${this.option.optionName}`;
  }

  getOptions(): CartOption[] {
    return [...this.wrapped.getOptions(), this.option];
  }

  getSku(): string {
    return this.wrapped.getSku();
  }

  getDishId(): number {
    return this.wrapped.getDishId();
  }
}

/**
 * Factory function: builds a fully decorated cart item from raw dish + selected options.
 * Applies each option as a decorator layer around the base dish.
 */
export const buildDecoratedItem = (
  dish: { id: number; name: string; sku: string; finalPrice: number },
  options: CartOption[],
): ICartItem => {
  let item: ICartItem = new BaseDish(dish);
  for (const opt of options) {
    item = new DishOptionDecorator(item, opt);
  }
  return item;
};
