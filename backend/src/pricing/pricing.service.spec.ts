import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PricingService', () => {
  let service: PricingService;

  const mockPrismaService = {
    priceTier: {
      findUnique: jest.fn(),
    },
    dishPrice: {
      findUnique: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrismaService }
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDerivedPrice', () => {
    it('should return base price if no derivation', () => {
      const tier = { id: 1, name: 'Standard', derivationType: null, derivationValue: null };
      expect(service.calculateDerivedPrice(1000, tier as any)).toBe(1000);
    });

    it('should add amount correctly', () => {
      const tier = { id: 1, name: 'Tier 1', derivationType: 'ADD_AMOUNT', derivationValue: 250 };
      expect(service.calculateDerivedPrice(1000, tier as any)).toBe(1250);
    });

    it('should subtract amount correctly', () => {
      const tier = { id: 1, name: 'Tier 2', derivationType: 'SUBTRACT_AMOUNT', derivationValue: 100 };
      expect(service.calculateDerivedPrice(1000, tier as any)).toBe(900);
    });

    it('should multiply correctly', () => {
      const tier = { id: 1, name: 'Tier 3', derivationType: 'MULTIPLY', derivationValue: 1.5 };
      expect(service.calculateDerivedPrice(1000, tier as any)).toBe(1500);
    });

    it('should apply markup percent correctly', () => {
      const tier = { id: 1, name: 'Tier 4', derivationType: 'MARKUP_PERCENT', derivationValue: 10 }; // 10% markup
      expect(service.calculateDerivedPrice(1000, tier as any)).toBe(1100);
    });
  });
});
