import { ConfigService } from '@nestjs/config';

import * as factories from 'factories';

import { DisableForPlatformUsersGuard } from './disable-for-platform-users.guard';

describe(DisableForPlatformUsersGuard, () => {
  let mockContext: any;
  const mockConfigService = {
    get: jest.fn().mockImplementation(() => 2),
  } as unknown as ConfigService;

  beforeEach(() => {
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  describe('normal access flow', () => {
    it('accepts when user is not a platform user', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayload.build(),
      });

      const guard = new DisableForPlatformUsersGuard(mockConfigService);

      expect(await guard.canActivate(mockContext)).toBeTruthy();
    });

    it('refuses when user is a platform user', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build(),
      });

      const guard = new DisableForPlatformUsersGuard(mockConfigService);

      expect(await guard.canActivate(mockContext)).not.toBeTruthy();
    });
  });

  describe('soul (platform 2) login flow', () => {
    it('accepts when user is soul platform user', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({ platformId: 2 }),
      });

      const guard = new DisableForPlatformUsersGuard(mockConfigService);
      expect(await guard.canActivate(mockContext)).toBeTruthy();
    });
  });
});
