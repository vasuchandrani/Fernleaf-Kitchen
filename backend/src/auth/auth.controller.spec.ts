import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a token on login', async () => {
    const user = { id: 1, email: 'test@test.com' };
    const req = { user };
    mockAuthService.login.mockResolvedValue({ access_token: 'token123' });

    const result = await controller.login(req as any);
    expect(result).toEqual({ access_token: 'token123' });
    expect(mockAuthService.login).toHaveBeenCalledWith(user);
  });

  it('should return the current user on profile request', () => {
    const user = { id: 1, email: 'test@test.com' };
    const req = { user };
    expect(controller.getProfile(req as any)).toEqual(user);
  });
});
