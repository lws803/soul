import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { Platform } from './entities/platform.entity';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformCategory } from './entities/platform-category.entity';
import { PlatformsService } from './platforms.service';
import {
  DuplicatePlatformUserException,
  PlatformCategoryNotFoundException,
} from './exceptions';

describe('PlatformsService', () => {
  let service: PlatformsService;
  let platformRepository: Repository<Platform>;
  let platformUserRepository: Repository<PlatformUser>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let platformCategoryRepository: Repository<PlatformCategory>;
  let platformCreateQueryBuilder: any;

  beforeEach(async () => {
    platformCreateQueryBuilder = {
      select: jest.fn().mockImplementation(() => platformCreateQueryBuilder),
      where: jest.fn().mockImplementation(() => platformCreateQueryBuilder),
      orderBy: jest.fn().mockImplementation(() => platformCreateQueryBuilder),
      skip: jest.fn().mockImplementation(() => platformCreateQueryBuilder),
      take: jest.fn().mockImplementation(() => platformCreateQueryBuilder),
      leftJoinAndSelect: jest
        .fn()
        .mockImplementation(() => platformCreateQueryBuilder),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([
          factories.platformArray.build(),
          factories.platformArray.build().length,
        ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformsService,
        {
          provide: getRepositoryToken(Platform),
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            findAndCount: jest
              .fn()
              .mockResolvedValue([
                factories.platformArray.build(),
                factories.platformArray.build().length,
              ]),
            save: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => platformCreateQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(PlatformCategory),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.onePlatformCategory.build()),
          },
        },
        {
          provide: getRepositoryToken(PlatformUser),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.onePlatformUser.build()),
            findAndCount: jest.fn(),
            save: jest
              .fn()
              .mockResolvedValue(
                factories.onePlatformUser.build({ roles: [UserRole.Member] }),
              ),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                getOne: jest
                  .fn()
                  .mockResolvedValue(factories.onePlatformUser.build()),
              }),
            }),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.refreshToken.build()),
            update: jest.fn(),
          },
        },

        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
          },
        },
      ],
    }).compile();

    service = module.get<PlatformsService>(PlatformsService);
    platformRepository = module.get<Repository<Platform>>(
      getRepositoryToken(Platform),
    );
    platformUserRepository = module.get<Repository<PlatformUser>>(
      getRepositoryToken(PlatformUser),
    );
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    platformCategoryRepository = module.get<Repository<PlatformCategory>>(
      getRepositoryToken(PlatformCategory),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create a platform successfully', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      const newPlatform = await service.create(
        factories.createPlatformDto.build(),
        user.id,
      );

      expect(newPlatform).toEqual(platform);

      expect(platformRepository.save).toHaveBeenCalledWith({
        name: 'TEST_PLATFORM',
        redirectUris: ['TEST_REDIRECT_URI'],
        category: factories.onePlatformCategory.build(),
      });
      expect(platformRepository.update).toHaveBeenCalledWith(
        { id: platform.id },
        { nameHandle: 'TEST_PLATFORM#1' },
      );
      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform,
        roles: [UserRole.Admin, UserRole.Member],
        user,
      });
    });

    it("should throw an error when category doesn't exist", async () => {
      jest.spyOn(platformCategoryRepository, 'findOne').mockResolvedValue(null);
      const user = factories.oneUser.build();
      await expect(
        service.create(
          factories.createPlatformDto.build({ category: 'UNKNOWN_CATEGORY' }),
          user.id,
        ),
      ).rejects.toThrow(
        'The category with name: UNKNOWN_CATEGORY was not found, please try again.',
      );
      expect(platformRepository.save).not.toHaveBeenCalled();
      expect(platformRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should find all platforms', async () => {
      const platforms = factories.platformArray.build();

      expect(await service.findAll({ page: 1, numItemsPerPage: 10 })).toEqual({
        platforms,
        totalCount: platforms.length,
      });
    });

    it('should find all platforms with pagination', async () => {
      const platforms = factories.platformArray.build();
      jest
        .spyOn(platformCreateQueryBuilder, 'getManyAndCount')
        .mockResolvedValueOnce([[platforms[0]], platforms.length]);

      expect(await service.findAll({ page: 1, numItemsPerPage: 1 })).toEqual({
        platforms: [platforms[0]],
        totalCount: platforms.length,
      });

      expect(platformCreateQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(platformCreateQueryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should find all platforms with isVerified filter', async () => {
      const platforms = factories.platformArray.build();

      expect(
        await service.findAll({
          page: 1,
          numItemsPerPage: 10,
          isVerified: true,
        }),
      ).toEqual({
        platforms,
        totalCount: platforms.length,
      });

      expect(platformCreateQueryBuilder.where).toHaveBeenCalledWith(
        'platform.isVerified = :isVerified',
        { isVerified: true },
      );
    });

    it('should query for platforms with the given full text query', async () => {
      const platforms = factories.platformArray.build();

      expect(
        await service.findAll({
          page: 1,
          numItemsPerPage: 10,
          q: 'TEST_PLATFORM',
        }),
      ).toEqual({
        platforms,
        totalCount: platforms.length,
      });

      expect(platformCreateQueryBuilder.where).toHaveBeenCalledWith(
        'platform.name like :query',
        { query: 'TEST_PLATFORM%' },
      );
    });

    it('should filter for platforms with the associated category', async () => {
      const platforms = factories.platformArray.build();

      expect(
        await service.findAll({
          page: 1,
          numItemsPerPage: 10,
          category: 'CATEGORY',
        }),
      ).toEqual({
        platforms,
        totalCount: platforms.length,
      });

      expect(platformCategoryRepository.findOne).toHaveBeenCalledWith({
        name: 'CATEGORY',
      });
      expect(platformCreateQueryBuilder.where).toHaveBeenCalledWith(
        'platform.category = :categoryId',
        { categoryId: factories.onePlatformCategory.build().id },
      );
    });

    it('should throw if the filtering category does not exist', async () => {
      jest.spyOn(platformCategoryRepository, 'findOne').mockResolvedValue(null);
      const categoryName = 'UNKNOWN_CATEGORY';
      await expect(
        service.findAll({
          page: 1,
          numItemsPerPage: 10,
          category: categoryName,
        }),
      ).rejects.toThrow(
        new PlatformCategoryNotFoundException({ name: categoryName }),
      );
    });
  });

  describe('findOne()', () => {
    it('should return one platform successfully', async () => {
      const platform = factories.onePlatform.build();

      expect(await service.findOne(platform.id)).toEqual(platform);

      expect(platformRepository.findOne).toHaveBeenCalledWith(platform.id, {
        relations: ['userConnections', 'category'],
      });
    });

    it('should throw not found error', async () => {
      jest.spyOn(platformRepository, 'findOne').mockResolvedValue(null);
      const platform = factories.onePlatform.build();

      await expect(
        async () => await service.findOne(platform.id),
      ).rejects.toThrow(
        'The platform with id: 1 was not found, please try again.',
      );
    });
  });

  describe('findOnePlatformUser()', () => {
    it('should return one platform user successfully', async () => {
      const platformUser = factories.onePlatformUser.build();
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      expect(await service.findOnePlatformUser(platform.id, user.id)).toEqual(
        platformUser,
      );

      expect(platformUserRepository.findOne).toHaveBeenCalledWith({
        user,
        platform,
      });
    });

    it('should throw not found error', async () => {
      jest.spyOn(platformUserRepository, 'findOne').mockResolvedValue(null);
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      await expect(
        async () => await service.findOnePlatformUser(platform.id, user.id),
      ).rejects.toThrow(
        'The user with username: TEST_USER#1 was not found on platform: TEST_PLATFORM#1, please try again.',
      );
    });
  });

  describe('update()', () => {
    it('should update platform successfully', async () => {
      const updatedCategory = factories.onePlatformCategory.build({
        name: 'CATEGORY_UPDATE',
      });
      const platform = factories.onePlatform.build();
      const updates = {
        name: 'TEST_PLATFORM_UPDATE',
        nameHandle: 'TEST_PLATFORM_UPDATE#1',
        category: updatedCategory,
        redirectUris: ['TEST_REDIRECT_URI'],
      };
      const updatedPlatform = factories.onePlatform.build(updates);

      jest
        .spyOn(platformRepository, 'findOne')
        .mockResolvedValue(updatedPlatform);
      jest
        .spyOn(platformCategoryRepository, 'findOne')
        .mockResolvedValue(updatedCategory);

      expect(
        await service.update(platform.id, factories.updatePlatformDto.build()),
      ).toEqual(updatedPlatform);

      expect(platformCategoryRepository.findOne).toHaveBeenCalledWith({
        name: 'CATEGORY_UPDATE',
      });

      expect(platformRepository.update).toHaveBeenCalledWith(
        { id: platform.id },
        updates,
      );
    });

    it("should throw an error when category doesn't exist", async () => {
      jest.spyOn(platformCategoryRepository, 'findOne').mockResolvedValue(null);
      const platform = factories.onePlatform.build();
      await expect(
        service.update(platform.id, factories.updatePlatformDto.build()),
      ).rejects.toThrow(
        'The category with name: CATEGORY_UPDATE was not found, please try again.',
      );
      expect(platformRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('should remove platform successfully', async () => {
      const platform = factories.onePlatform.build();

      await service.remove(platform.id);

      expect(platformRepository.delete).toHaveBeenCalledWith({
        id: platform.id,
      });
    });
  });

  describe('setUserRole()', () => {
    it('should set platform user role successfully', async () => {
      const platformUser = factories.onePlatformUser.build();
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      await service.setUserRole(platform.id, user.id, [
        UserRole.Admin,
        UserRole.Member,
      ]);

      expect(platformUserRepository.save).toHaveBeenCalledWith(platformUser);
      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        platformUser,
      });
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { platformUser },
        { isRevoked: true },
      );
    });
  });

  describe('removeUser()', () => {
    it('should delete user successfully', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      await service.removeUser(platform.id, user.id);

      expect(service.findOnePlatformUser).toHaveBeenCalledWith(
        platform.id,
        user.id,
      );
      expect(platformUserRepository.delete).toHaveBeenCalledWith({
        id: platformUser.id,
      });
    });
  });

  describe('findAllPlatformUsers()', () => {
    it('should return all platform users successfully', async () => {
      const platform = factories.onePlatform.build();
      const platformUsers = factories.platformUserArray.build();
      jest
        .spyOn(platformUserRepository, 'findAndCount')
        .mockResolvedValue([platformUsers, platformUsers.length]);

      expect(
        await service.findAllPlatformUsers(platform.id, {
          page: 1,
          numItemsPerPage: 10,
        }),
      ).toEqual({ platformUsers, totalCount: platformUsers.length });

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          id: 'ASC',
        },
        relations: ['user'],
        skip: 0,
        take: 10,
        where: {
          platform,
        },
      });
    });

    it('should return all platform users with pagination successfully', async () => {
      const platform = factories.onePlatform.build();
      const platformUsers = factories.platformUserArray.build();
      jest
        .spyOn(platformUserRepository, 'findAndCount')
        .mockResolvedValue([[platformUsers[0]], platformUsers.length]);

      expect(
        await service.findAllPlatformUsers(platform.id, {
          page: 1,
          numItemsPerPage: 1,
        }),
      ).toEqual({
        platformUsers: [platformUsers[0]],
        totalCount: platformUsers.length,
      });

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          id: 'ASC',
        },
        relations: ['user'],
        skip: 0,
        take: 1,
        where: {
          platform,
        },
      });
    });
  });

  describe('addUser()', () => {
    it('should add user successfully', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      expect(await service.addUser(platform.id, user.id)).toEqual(
        factories.onePlatformUser.build({
          roles: [UserRole.Member],
        }),
      );

      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform: factories.onePlatform.build(),
        roles: [UserRole.Member],
        user: factories.oneUser.build(),
      });
    });

    it('should raise duplicate error', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      jest
        .spyOn(platformUserRepository, 'save')
        .mockRejectedValue(
          new QueryFailedError('', [], { code: 'ER_DUP_ENTRY' }),
        );

      await expect(service.addUser(platform.id, user.id)).rejects.toThrow(
        new DuplicatePlatformUserException(),
      );
    });
  });
});
