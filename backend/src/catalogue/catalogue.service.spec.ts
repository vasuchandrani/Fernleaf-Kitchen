import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueService } from './catalogue.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CatalogueService', () => {
  let service: CatalogueService;
  let prisma: PrismaService;

  const mockPrismaService = {
    dish: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    category: { findUnique: jest.fn() },
    kitchenStation: { findUnique: jest.fn() },
    priceTier: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    priceTierDish: { createMany: jest.fn() },
    optionGroup: { create: jest.fn(), findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CatalogueService>(CatalogueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDish', () => {
    it('should create a dish successfully', async () => {
      const createDto = {
        name: 'Test Dish',
        sku: 'TEST-01',
        temperature: 'HOT',
        costPrice: 500,
        categoryId: 1,
        dietaryType: 'VEG',
      };
      const expectedDish = { id: 1, ...createDto, isActive: true };
      
      mockPrismaService.category.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.kitchenStation.findUnique.mockResolvedValue(null);
      mockPrismaService.priceTier.findFirst.mockResolvedValue(null);
      mockPrismaService.dish.create.mockResolvedValue(expectedDish);

      const result = await service.createDish(createDto as any);
      expect(result).toEqual(expectedDish);
      expect(prisma.dish.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('should allow a dish without a kitchen station and leave it unassigned', async () => {
      const createDto = {
        name: 'Unassigned Dish',
        sku: 'UNASSIGNED-01',
        temperature: 'HOT',
        costPrice: 500,
        categoryId: 1,
        dietaryType: 'VEG',
      };
      const expectedDish = { id: 2, ...createDto, kitchenStationId: null, isActive: true };

      mockPrismaService.category.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.kitchenStation.findUnique.mockResolvedValue(null);
      mockPrismaService.priceTier.findFirst.mockResolvedValue(null);
      mockPrismaService.dish.create.mockResolvedValue(expectedDish);

      await expect(service.createDish(createDto as any)).resolves.toEqual(expectedDish);
      expect(prisma.dish.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('should throw ConflictException if SKU already exists', async () => {
      const createDto = {
        name: 'Test Dish',
        sku: 'TEST-01',
        temperature: 'HOT',
        costPrice: 500,
      };
      
      mockPrismaService.dish.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.createDish(createDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateDish', () => {
    it('should set isActive to false instead of deleting', async () => {
      const existingDish = { id: 1, name: 'Test', isActive: true };
      mockPrismaService.dish.findUnique.mockResolvedValue(existingDish);
      mockPrismaService.dish.update.mockResolvedValue({ ...existingDish, isActive: false });

      const result = await service.deactivateDish(1);
      
      expect(prisma.dish.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if dish to deactivate does not exist', async () => {
      mockPrismaService.dish.findUnique.mockResolvedValue(null);
      await expect(service.deactivateDish(999)).rejects.toThrow(NotFoundException);
    });

    describe('createOptionGroup', () => {
      it('creates a group for the selected non-default catalogue', async () => {
        mockPrismaService.dish.findUniqueOrThrow.mockResolvedValue({ id: 49 });
        mockPrismaService.priceTier.findUnique.mockResolvedValue({ id: 17, isDefault: false });
        const createdGroup = {
          id: 1,
          dishId: 49,
          priceTierId: 17,
          name: 'Rice',
          isRequired: false,
          displayOrder: 1,
        };
        mockPrismaService.optionGroup.create.mockResolvedValue(createdGroup);

        await expect(service.createOptionGroup(49, {
          name: 'Rice',
          isRequired: false,
          tierId: 17,
        })).resolves.toEqual(createdGroup);

        expect(prisma.optionGroup.create).toHaveBeenCalledWith({
          data: {
            dishId: 49,
            name: 'Rice',
            isRequired: false,
            displayOrder: 1,
            priceTierId: 17,
          },
        });
      });
    });
  });
});
