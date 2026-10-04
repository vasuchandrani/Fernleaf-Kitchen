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
      update: jest.fn(),
    },
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
      };
      const expectedDish = { id: 1, ...createDto, isActive: true };
      
      mockPrismaService.dish.create.mockResolvedValue(expectedDish);

      const result = await service.createDish(createDto as any);
      expect(result).toEqual(expectedDish);
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
  });
});
