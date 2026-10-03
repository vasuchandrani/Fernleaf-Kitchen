import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUsersService = {
  findByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate user with correct credentials', async () => {
    const user = { id: 1, email: 'test@test.com', password: 'hashedpassword' };
    mockUsersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser('test@test.com', 'password123');
    expect(result).toEqual({ id: 1, email: 'test@test.com' });
  });

  it('should return null for invalid credentials', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    const result = await service.validateUser('test@test.com', 'wrongpassword');
    expect(result).toBeNull();
  });

  it('should generate a jwt token on login', async () => {
    const user = { id: 1, email: 'test@test.com' };
    mockJwtService.sign.mockReturnValue('test-token');

    const result = await service.login(user as any);
    expect(result).toEqual({ access_token: 'test-token' });
    expect(mockJwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
  });
});
