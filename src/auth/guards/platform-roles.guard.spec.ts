import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import * as factories from 'factories';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UserRole } from 'src/roles/role.enum';

import { NoPermissionException } from '../exceptions/no-permission.exception';

import { PlatformRolesGuard } from './platform-roles.guard';

describe(PlatformRolesGuard, () => {
  let mockContext: any;
  const mockReflector = {
    getAllAndOverride: jest.fn().mockImplementation(() => [UserRole.Admin]),
  } as unknown as Reflector;
  const mockPlatformUserService = {
    findOnePlatformUser: jest.fn(),
  } as unknown as PlatformsService;
  const mockConfigService = {
    get: jest.fn().mockImplementation(() => 2),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.spyOn(mockPlatformUserService, 'findOnePlatformUser');
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  describe('normal login flow', () => {
    it('accepts when user is admin of the platform', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build(),
        params: { platform_id: String(factories.platformEntity.build().id) },
      });

      const guard = new PlatformRolesGuard(
        mockReflector,
        mockPlatformUserService,
        mockConfigService,
      );

      expect(await guard.canActivate(mockContext)).toBeTruthy();
      expect(
        mockPlatformUserService.findOnePlatformUser,
      ).not.toHaveBeenCalled();
    });

    it('throws when user is not logged in to the correct platform', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({ platformId: 3 }),
        params: { platform_id: String(factories.platformEntity.build().id) },
      });

      const guard = new PlatformRolesGuard(
        mockReflector,
        mockPlatformUserService,
        mockConfigService,
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new NoPermissionException(),
      );
      expect(
        mockPlatformUserService.findOnePlatformUser,
      ).not.toHaveBeenCalled();
    });

    it('throws when user is logged in to the correct platform but does not have permissions', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({
          roles: [UserRole.Member],
        }),
        params: { platform_id: String(factories.platformEntity.build().id) },
      });

      const guard = new PlatformRolesGuard(
        mockReflector,
        mockPlatformUserService,
        mockConfigService,
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new NoPermissionException(),
      );
      expect(
        mockPlatformUserService.findOnePlatformUser,
      ).not.toHaveBeenCalled();
    });
  });

  describe('soul (platform 2) login flow', () => {
    it('accepts when user is the admin of the requested platform', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({ platformId: 2 }),
        params: { platform_id: String(factories.platformEntity.build().id) },
      });

      jest
        .spyOn(mockPlatformUserService, 'findOnePlatformUser')
        .mockResolvedValue(factories.platformUserEntity.build());

      const guard = new PlatformRolesGuard(
        mockReflector,
        mockPlatformUserService,
        mockConfigService,
      );

      expect(await guard.canActivate(mockContext)).toBeTruthy();
      expect(mockPlatformUserService.findOnePlatformUser).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('throws when user does not have permissions for the requested platform', async () => {
      jest.spyOn(mockContext, 'getRequest').mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({
          platformId: 2,
          roles: [UserRole.Member],
        }),
        params: { platform_id: String(factories.platformEntity.build().id) },
      });

      jest
        .spyOn(mockPlatformUserService, 'findOnePlatformUser')
        .mockResolvedValue(
          factories.platformUserEntity.build({ roles: [UserRole.Member] }),
        );

      const guard = new PlatformRolesGuard(
        mockReflector,
        mockPlatformUserService,
        mockConfigService,
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new NoPermissionException(),
      );
      expect(mockPlatformUserService.findOnePlatformUser).toHaveBeenCalledWith(
        1,
        1,
      );
    });
  });
});
