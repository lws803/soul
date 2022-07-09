import { Reflector } from '@nestjs/core';

import * as factories from 'factories';
import { PlatformsService } from 'src/platforms/platforms.service';

import { PlatformRolesGuard } from './platform-roles.guard';
import { UserRole } from './role.enum';
import { NoPermissionException } from './exceptions/no-permission.exception';

describe(PlatformRolesGuard, () => {
  let mockContext: any;
  const mockReflector = {
    getAllAndOverride: jest.fn().mockImplementation(() => [UserRole.Admin]),
  } as unknown as Reflector;

  it('accepts when user is admin of the platform', async () => {
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn().mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build(),
        params: { platform_id: String(factories.onePlatform.build().id) },
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    const mockPlatformUserService = {
      findOnePlatformUser: jest.fn(),
    } as unknown as PlatformsService;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserService,
    );

    expect(await guard.canActivate(mockContext)).toBeTruthy();
    expect(mockPlatformUserService.findOnePlatformUser).not.toHaveBeenCalled();
  });

  it('throws when user is not logged in to the correct platform', async () => {
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn().mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({ platformId: 3 }),
        params: { platform_id: String(factories.onePlatform.build().id) },
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    const mockPlatformUserService = {
      findOnePlatformUser: jest.fn(),
    } as unknown as PlatformsService;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserService,
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new NoPermissionException(),
    );
    expect(mockPlatformUserService.findOnePlatformUser).not.toHaveBeenCalled();
  });

  it('throws when user is logged in to the correct platform but does not have permissions', async () => {
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn().mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({
          roles: [UserRole.Member],
        }),
        params: { platform_id: String(factories.onePlatform.build().id) },
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    const mockPlatformUserService = {
      findOnePlatformUser: jest.fn(),
    } as unknown as PlatformsService;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserService,
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new NoPermissionException(),
    );
    expect(mockPlatformUserService.findOnePlatformUser).not.toHaveBeenCalled();
  });

  it('accepts when user is logged in to soul landing but is the admin of the requested platform', async () => {
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn().mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({ platformId: 2 }),
        params: { platform_id: String(factories.onePlatform.build().id) },
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    const mockPlatformUserService = {
      findOnePlatformUser: jest.fn().mockImplementation(() => {
        return {
          roles: [UserRole.Admin],
        };
      }),
    } as unknown as PlatformsService;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserService,
    );

    expect(await guard.canActivate(mockContext)).toBeTruthy();
    expect(mockPlatformUserService.findOnePlatformUser).toHaveBeenCalledWith(
      1,
      1,
    );
  });

  it('throws when user is logged in to soul landing but does not have permissions for the requested platform', async () => {
    mockContext = {
      switchToHttp: jest.fn().mockImplementation(() => mockContext),
      getRequest: jest.fn().mockReturnValue({
        user: factories.jwtPayloadWithPlatform.build({
          platformId: 2,
          roles: [UserRole.Member],
        }),
        params: { platform_id: String(factories.onePlatform.build().id) },
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    const mockPlatformUserService = {
      findOnePlatformUser: jest.fn().mockImplementation(() => {
        return {
          roles: [UserRole.Member],
        };
      }),
    } as unknown as PlatformsService;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserService,
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
