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
            }),
            findCodeForPlatformAndCallback: jest.fn().mockResolvedValue({
              code: 'CODE',
            }),
            exchangeCodeForToken: jest.fn().mockReturnValue({
              accessToken: 'ACCESS_TOKEN',
              refreshToken: 'REFRESH_TOKEN',
              platformId: factories.platformEntity.build().id,
              roles: [UserRole.Admin, UserRole.Member],
            }),
            refreshWithPlatform: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
              refreshToken: 'REFRESH_TOKEN',
              platformId: 1,
              roles: [UserRole.Admin, UserRole.Member],
            }),
            authenticateClient: jest.fn().mockResolvedValue({
              accessToken: 'CLIENT_ACCESS_TOKEN',
              platformId: 1,
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
      const user = factories.userEntity.build();
      const result = await controller.login({ user });

      expect(result).toEqual({ accessToken: 'ACCESS_TOKEN' });
      expect(service.login).toHaveBeenCalledWith(user);
    });
  });

  describe('refresh()', () => {
    it('should return token with platformId', async () => {
      const refreshToken = 'REFRESH_TOKEN';
      const result = await controller.refresh({ platformId: 1, refreshToken });

      expect(result).toEqual({
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
        platformId: 1,
        roles: [UserRole.Admin, UserRole.Member],
      });
      expect(service.refreshWithPlatform).toHaveBeenCalledWith(refreshToken, 1);
    });
  });

  describe('code()', () => {
    it('should return code for platform', async () => {
      const user = factories.userEntity.build();
      const platformId = 1;
      const result = await controller.code(
        { user },
        {
          platformId,
          callback: 'TEST_REDIRECT_URI',
          state: 'TEST_STATE',
          codeChallenge: 'CODE_CHALLENGE',
        },
      );

      expect(result).toEqual({
        code: 'CODE',
      });
      expect(service.findCodeForPlatformAndCallback).toHaveBeenCalledWith({
        user,
        platformId,
        callback: 'TEST_REDIRECT_URI',
        state: 'TEST_STATE',
        codeChallenge: 'CODE_CHALLENGE',
      });
    });
  });

  describe('verify()', () => {
    it('should exchange code for tokens', async () => {
      const code = 'CODE';
      const callback = 'TEST_REDIRECT_URI';
      const codeVerifier = 'CODE_VERIFIER';
      const result = await controller.verify({ code, callback, codeVerifier });

      expect(result).toEqual({
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
        platformId: 1,
        roles: [UserRole.Admin, UserRole.Member],
      });
      expect(service.exchangeCodeForToken).toHaveBeenCalledWith({
        callback: 'TEST_REDIRECT_URI',
        code: 'CODE',
        codeVerifier: 'CODE_VERIFIER',
      });
    });
  });

  describe('authenticateClient()', () => {
    it('should authenticate client', async () => {
      const platform = factories.platformEntity.build({
        clientSecret: 'CLIENT_SECRET',
      });
      const result = await controller.authenticateClient({
        platformId: platform.id,
        clientSecret: platform.clientSecret,
      });

      expect(result).toEqual({
        accessToken: 'CLIENT_ACCESS_TOKEN',
        platformId: platform.id,
      });
      expect(service.authenticateClient).toHaveBeenCalledWith(
        platform.id,
        platform.clientSecret,
      );
    });
  });
});
