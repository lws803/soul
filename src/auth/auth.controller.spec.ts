import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { UserRole } from 'src/roles/role.enum';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthService', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
              refreshToken: 'REFRESH_TOKEN',
            }),
            getCodeForPlatformAndCallback: jest.fn().mockResolvedValue({
              code: 'CODE',
            }),
            exchangeCodeForToken: jest.fn().mockReturnValue({
              accessToken: 'ACCESS_TOKEN',
              refreshToken: 'REFRESH_TOKEN',
              platformId: factories.onePlatform.build().id,
              roles: [UserRole.Admin, UserRole.Member],
            }),
            refresh: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
            }),
            refreshWithPlatform: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
              platformId: 1,
              roles: [UserRole.Admin, UserRole.Member],
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('should return token', async () => {
      const user = factories.oneUser.build();
      const result = await controller.login({ user });

      expect(result).toEqual({
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
      });
      expect(service.login).toHaveBeenCalledWith(user);
    });
  });

  describe('refresh()', () => {
    it('should return token', async () => {
      const refreshToken = 'REFRESH_TOKEN';
      const result = await controller.refresh({}, { refreshToken });

      expect(result).toEqual({
        accessToken: 'ACCESS_TOKEN',
      });
      expect(service.refresh).toHaveBeenCalledWith(refreshToken);
    });

    it('should return token with platformId', async () => {
      const refreshToken = 'REFRESH_TOKEN';
      const result = await controller.refresh(
        { platformId: 1 },
        { refreshToken },
      );

      expect(result).toEqual({
        accessToken: 'ACCESS_TOKEN',
        platformId: 1,
        roles: [UserRole.Admin, UserRole.Member],
      });
      expect(service.refreshWithPlatform).toHaveBeenCalledWith(refreshToken, 1);
    });
  });

  describe('code()', () => {
    it('should return code for platform', async () => {
      const user = factories.oneUser.build();
      const platformId = 1;
      const result = await controller.code(
        { user },
        { platformId, callback: 'TEST_REDIRECT_URI', state: 'TEST_STATE' },
      );

      expect(result).toEqual({
        code: 'CODE',
      });
      expect(service.getCodeForPlatformAndCallback).toHaveBeenCalledWith({
        user,
        platformId,
        callback: 'TEST_REDIRECT_URI',
        state: 'TEST_STATE',
      });
    });
  });

  describe('verify()', () => {
    it('should exchange code for tokens', async () => {
      const code = 'CODE';
      const callback = 'TEST_REDIRECT_URI';
      const result = await controller.verify({ code, callback });

      expect(result).toEqual({
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
        platformId: 1,
        roles: [UserRole.Admin, UserRole.Member],
      });
      expect(service.exchangeCodeForToken).toHaveBeenCalledWith(code, callback);
    });
  });
});
