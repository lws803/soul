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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformsController],
      providers: [
        {
          provide: PlatformsService,
          useValue: {
            create: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            findAll: jest.fn().mockResolvedValue({
              platforms: factories.platformArray.build(),
              totalCount: factories.platformArray.build().length,
            }),
            findMyPlatforms: jest.fn().mockResolvedValue({
              platforms: factories.platformArray.build(),
              totalCount: factories.platformArray.build().length,
            }),
            findOne: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            update: jest.fn().mockResolvedValue(
              factories.onePlatform.build({
                ...factories.updatePlatformDto.build(),
                category: factories.onePlatformCategory.build({
                  name: 'CATEGORY_UPDATE',
                }),
              }),
            ),
            remove: jest.fn(),
            setUserRole: jest
              .fn()
              .mockResolvedValue(factories.onePlatformUser.build()),
            removeUser: jest.fn(),
            addUser: jest
              .fn()
              .mockResolvedValue(factories.onePlatformUser.build()),
            findAllPlatformUsers: jest.fn().mockResolvedValue({
              platformUsers: factories.platformUserArray.build(),
              totalCount: factories.platformUserArray.build().length,
            }),
            findOnePlatformUser: jest
              .fn()
              .mockResolvedValue(factories.onePlatformUser.build()),
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
    ).toEqual(factories.onePlatform.build());
    expect(platformsService.create).toHaveBeenCalledWith(
      createPlatformDto,
      jwtPayload.userId,
    );
  });

  it('findAll()', async () => {
    const platformsArray = factories.platformArray.build();
    const paginationParams = { page: 1, numItemsPerPage: 10 };
    expect(await controller.findAll(paginationParams)).toEqual({
      platforms: platformsArray,
      totalCount: platformsArray.length,
    });

    expect(platformsService.findAll).toHaveBeenCalledWith(paginationParams);
  });

  it('findMyPlatforms()', async () => {
    const platformsArray = factories.platformArray.build();
    const paginationParams = { page: 1, numItemsPerPage: 10 };
    const queryParams = { ...paginationParams, role: UserRole.Member };
    const userJwt = factories.jwtPayload.build();
    expect(
      await controller.findMyPlatforms({ user: userJwt }, queryParams),
    ).toEqual({
      platforms: platformsArray,
      totalCount: platformsArray.length,
    });

    expect(platformsService.findMyPlatforms).toHaveBeenCalledWith(
      queryParams,
      userJwt.userId,
    );
  });

  it('findOne()', async () => {
    const platform = factories.onePlatform.build();
    expect(await controller.findOne({ platformId: platform.id })).toEqual(
      platform,
    );

    expect(platformsService.findOne).toHaveBeenCalledWith(platform.id);
  });

  it('update()', async () => {
    const updatePlatformDto = factories.updatePlatformDto.build();
    const platform = factories.onePlatform.build();
    const updatedPlatform = factories.onePlatform.build({
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
    const platform = factories.onePlatform.build();

    expect(
      await controller.remove({ platformId: platform.id }),
    ).toBeUndefined();

    expect(platformsService.remove).toHaveBeenCalledWith(platform.id);
  });

  it('setPlatformUserRole()', async () => {
    const user = factories.oneUser.build();
    const platform = factories.onePlatform.build();

    expect(
      await controller.setPlatformUserRole(
        { platformId: platform.id, userId: user.id },
        {
          roles: [UserRole.Member],
        },
      ),
    ).toEqual(factories.onePlatformUser.build());

    expect(platformsService.setUserRole).toHaveBeenCalledWith(
      platform.id,
      user.id,
      [UserRole.Member],
    );
  });

  it('removePlatformUser()', async () => {
    const user = factories.oneUser.build();
    const platform = factories.onePlatform.build();

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
    const platform = factories.onePlatform.build();
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
    const platform = factories.onePlatform.build();
    const oneUser = factories.oneUser.build();

    expect(
      await controller.joinPlatform(
        { user: factories.jwtPayload.build() },
        {
          platformId: platform.id,
        },
      ),
    ).toEqual(factories.onePlatformUser.build());

    expect(platformsService.addUser).toHaveBeenCalledWith(
      platform.id,
      oneUser.id,
    );
  });

  it('findAllPlatformUsers()', async () => {
    const platform = factories.onePlatform.build();
    const platformUsers = factories.platformUserArray.build();

    expect(
      await controller.findAllPlatformUsers(
        { platformId: platform.id },
        { page: 1, numItemsPerPage: 10 },
      ),
    ).toEqual({ platformUsers, totalCount: platformUsers.length });

    expect(platformsService.findAllPlatformUsers).toHaveBeenCalledWith(
      platform.id,
      { numItemsPerPage: 10, page: 1 },
    );
  });
});
