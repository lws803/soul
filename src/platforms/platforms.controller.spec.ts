import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';
import { UserRole } from 'src/roles/role.enum';

import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

describe('PlatformsController', () => {
  let controller: PlatformsController;
  let platformsService: PlatformsService;

  beforeEach(async () => {
    const platforms = factories.platformEntity.buildList(2);
    const platformUsers = factories.platformUser.buildList(2);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformsController],
      providers: [
        {
          provide: PlatformsService,
          useValue: {
            create: jest
              .fn()
              .mockResolvedValue(factories.platformEntity.build()),
            findAll: jest.fn().mockResolvedValue({
              platforms,
              totalCount: platforms.length,
            }),
            findMyPlatforms: jest.fn().mockResolvedValue({
              platforms,
              totalCount: platforms.length,
            }),
            findOne: jest
              .fn()
              .mockResolvedValue(factories.platformEntity.build()),
            update: jest.fn().mockResolvedValue(
              factories.platformEntity.build({
                ...factories.updatePlatformDto.build(),
                category: factories.onePlatformCategory.build({
                  name: 'CATEGORY_UPDATE',
                }),
              }),
            ),
            remove: jest.fn(),
            setUserRole: jest
              .fn()
              .mockResolvedValue(factories.platformUser.build()),
            removeUser: jest.fn(),
            addUser: jest
              .fn()
              .mockResolvedValue(factories.platformUser.build()),
            findAllPlatformUsers: jest.fn().mockResolvedValue({
              platformUsers,
              totalCount: platformUsers.length,
            }),
            findOnePlatformUser: jest
              .fn()
              .mockResolvedValue(factories.platformUser.build()),
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

    controller = module.get<PlatformsController>(PlatformsController);
    platformsService = module.get<PlatformsService>(PlatformsService);
  });

  it('create()', async () => {
    const createPlatformDto = factories.createPlatformDto.build();
    const jwtPayload = factories.jwtPayload.build();

    expect(
      await controller.create({ user: jwtPayload }, createPlatformDto),
    ).toEqual(factories.platformEntity.build());
    expect(platformsService.create).toHaveBeenCalledWith(
      createPlatformDto,
      jwtPayload.userId,
    );
  });

  it('findAll()', async () => {
    const platformsList = factories.platformEntity.buildList(2);
    const paginationParams = { page: 1, numItemsPerPage: 10 };
    expect(await controller.findAll(paginationParams)).toEqual({
      platforms: platformsList,
      totalCount: platformsList.length,
    });

    expect(platformsService.findAll).toHaveBeenCalledWith(paginationParams);
  });

  it('findMyPlatforms()', async () => {
    const platformsList = factories.platformEntity.buildList(2);
    const paginationParams = { page: 1, numItemsPerPage: 10 };
    const queryParams = { ...paginationParams, role: UserRole.Member };
    const userJwt = factories.jwtPayload.build();
    expect(
      await controller.findMyPlatforms({ user: userJwt }, queryParams),
    ).toEqual({
      platforms: platformsList,
      totalCount: platformsList.length,
    });

    expect(platformsService.findMyPlatforms).toHaveBeenCalledWith(
      queryParams,
      userJwt.userId,
    );
  });

  it('findOne()', async () => {
    const platform = factories.platformEntity.build();
    expect(await controller.findOne({ platformId: platform.id })).toEqual(
      platform,
    );

    expect(platformsService.findOne).toHaveBeenCalledWith(platform.id);
  });

  it('findOneFull()', async () => {
    const platform = factories.platformEntity.build();
    expect(await controller.findOneFull({ platformId: platform.id })).toEqual(
      platform,
    );

    expect(platformsService.findOne).toHaveBeenCalledWith(platform.id);
  });

  it('update()', async () => {
    const updatePlatformDto = factories.updatePlatformDto.build();
    const platform = factories.platformEntity.build();
    const updatedPlatform = factories.platformEntity.build({
      ...updatePlatformDto,
      category: factories.onePlatformCategory.build({
        name: 'CATEGORY_UPDATE',
      }),
    });

    expect(
      await controller.update({ platformId: platform.id }, updatePlatformDto),
    ).toEqual(updatedPlatform);

    expect(platformsService.update).toHaveBeenCalledWith(
      platform.id,
      updatePlatformDto,
    );
  });

  it('remove()', async () => {
    const platform = factories.platformEntity.build();

    expect(
      await controller.remove({ platformId: platform.id }),
    ).toBeUndefined();

    expect(platformsService.remove).toHaveBeenCalledWith(platform.id);
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
    ).toEqual(factories.platformUser.build());

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

  it('removeMyself()', async () => {
    const platform = factories.platformEntity.build();
    const user = factories.jwtPayload.build();
    expect(
      await controller.removeMyself({ user }, { platformId: platform.id }),
    ).toBeUndefined();

    expect(platformsService.removeUser).toHaveBeenCalledWith(
      platform.id,
      user.userId,
    );
  });

  it('joinPlatform()', async () => {
    const platform = factories.platformEntity.build();
    const oneUser = factories.userEntity.build();

    expect(
      await controller.joinPlatform(
        { user: factories.jwtPayload.build() },
        {
          platformId: platform.id,
        },
      ),
    ).toEqual(factories.platformUser.build());

    expect(platformsService.addUser).toHaveBeenCalledWith(
      platform.id,
      oneUser.id,
    );
  });

  it('findAllPlatformUsers()', async () => {
    const platform = factories.platformEntity.build();
    const platformUsers = factories.platformUser.buildList(2);

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
