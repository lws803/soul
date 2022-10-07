import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UserRole } from 'src/roles/role.enum';

import { PlatformUsersController } from './platform-users.controller';

describe('PlatformUsersController', () => {
  let controller: PlatformUsersController;
  let platformsService: PlatformsService;

  beforeEach(async () => {
    const platformUsers = factories.platformUserEntity.buildList(2);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformUsersController],
      providers: [
        {
          provide: PlatformsService,
          useValue: {
            setUserRole: jest
              .fn()
              .mockResolvedValue(factories.platformUserEntity.build()),
            removeUser: jest.fn(),
            addUser: jest
              .fn()
              .mockResolvedValue(factories.platformUserEntity.build()),
            findAllPlatformUsers: jest.fn().mockResolvedValue({
              platformUsers,
              totalCount: platformUsers.length,
            }),
            findOnePlatformUser: jest
              .fn()
              .mockResolvedValue(factories.platformUserEntity.build()),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(() => 2),
          },
        },
      ],
    }).compile();

    controller = module.get<PlatformUsersController>(PlatformUsersController);
    platformsService = module.get<PlatformsService>(PlatformsService);
  });

  it('setPlatformUserRole()', async () => {
    const user = factories.userEntity.build();
    const platform = factories.platformEntity.build();

    expect(
      await controller.setPlatformUserRole(
        { platformId: platform.id, userId: user.id },
        {
          roles: [UserRole.Member],
        },
      ),
    ).toEqual(factories.platformUserEntity.build());

    expect(platformsService.setUserRole).toHaveBeenCalledWith(
      platform.id,
      user.id,
      [UserRole.Member],
    );
  });

  it('removePlatformUser()', async () => {
    const user = factories.userEntity.build();
    const platform = factories.platformEntity.build();

    expect(
      await controller.removePlatformUser({
        platformId: platform.id,
        userId: user.id,
      }),
    ).toBeUndefined();

    expect(platformsService.removeUser).toHaveBeenCalledWith(
      platform.id,
      user.id,
    );
  });

  it('findAllPlatformUsers()', async () => {
    const platform = factories.platformEntity.build();
    const platformUsers = factories.platformUserEntity.buildList(2);

    expect(
      await controller.findAllPlatformUsers(
        { platformId: platform.id },
        { page: 1, numItemsPerPage: 10 },
      ),
    ).toEqual({ platformUsers, totalCount: platformUsers.length });

    expect(platformsService.findAllPlatformUsers).toHaveBeenCalledWith({
      platformId: platform.id,
      paginationParams: { numItemsPerPage: 10, page: 1 },
    });
  });
});
