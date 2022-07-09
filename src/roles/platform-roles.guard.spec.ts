import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';

import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import * as factories from 'factories';

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

    const mockPlatformUserRepository = {
      findOne: jest.fn(),
    } as unknown as Repository<PlatformUser>;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserRepository,
    );

    expect(await guard.canActivate(mockContext)).toBeTruthy();
    expect(mockPlatformUserRepository.findOne).not.toHaveBeenCalled();
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

    const mockPlatformUserRepository = {
      findOne: jest.fn(),
    } as unknown as Repository<PlatformUser>;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserRepository,
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new NoPermissionException(),
    );
    expect(mockPlatformUserRepository.findOne).not.toHaveBeenCalled();
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

    const mockPlatformUserRepository = {
      findOne: jest.fn(),
    } as unknown as Repository<PlatformUser>;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserRepository,
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new NoPermissionException(),
    );
    expect(mockPlatformUserRepository.findOne).not.toHaveBeenCalled();
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

    const mockPlatformUserRepository = {
      findOne: jest.fn().mockImplementation(() => {
        return {
          roles: [UserRole.Admin],
        };
      }),
    } as unknown as Repository<PlatformUser>;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserRepository,
    );

    expect(await guard.canActivate(mockContext)).toBeTruthy();
    expect(mockPlatformUserRepository.findOne).toHaveBeenCalledWith(
      {
        platform: {
          id: 1,
        },
        user: {
          id: 1,
        },
      },
      { relations: ['user'] },
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

    const mockPlatformUserRepository = {
      findOne: jest.fn().mockImplementation(() => {
        return {
          roles: [UserRole.Member],
        };
      }),
    } as unknown as Repository<PlatformUser>;

    const guard = new PlatformRolesGuard(
      mockReflector,
      mockPlatformUserRepository,
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new NoPermissionException(),
    );
    expect(mockPlatformUserRepository.findOne).toHaveBeenCalledWith(
      { platform: { id: 1 }, user: { id: 1 } },
      { relations: ['user'] },
    );
  });
});
