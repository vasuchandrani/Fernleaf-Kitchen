import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user by email including their roles and permissions', async () => {
    const email = 'admin@test.com';
    const expectedUser = { id: 1, email, name: 'Admin', role: {} };
    mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

    const result = await service.findByEmail(email);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });
    expect(result).toEqual(expectedUser);
  });
});
