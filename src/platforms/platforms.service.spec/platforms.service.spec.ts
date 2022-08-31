import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { Platform } from '../entities/platform.entity';
import { PlatformUser } from '../entities/platform-user.entity';
import { PlatformCategory } from '../entities/platform-category.entity';
import { PlatformsService } from '../platforms.service';
import {
  MaxAdminRolesPerUserException,
  PlatformCategoryNotFoundException,
} from '../exceptions';

import {
  platformCreateQueryBuilderObject,
  platformUserCreateQueryBuilderObject,
} from './utils';

describe('PlatformsService', () => {
  let service: PlatformsService;
  let platformRepository: Repository<Platform>;
  let platformUserRepository: Repository<PlatformUser>;
  let platformCategoryRepository: Repository<PlatformCategory>;
  let platformCreateQueryBuilder: any;
  let platformUserCreateQueryBuilder: any;

  beforeEach(async () => {
    platformCreateQueryBuilder = platformCreateQueryBuilderObject;
    platformUserCreateQueryBuilder = platformUserCreateQueryBuilderObject;

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
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => platformUserCreateQueryBuilder),
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
            findOne: jest.fn().mockResolvedValue(factories.user.build()),
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
    platformCategoryRepository = module.get<Repository<PlatformCategory>>(
      getRepositoryToken(PlatformCategory),
    );
  });

  describe('create()', () => {
    it('should create a platform successfully', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.user.build();

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
        { nameHandle: 'test_platform#1' },
      );
      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform,
        roles: [UserRole.Admin, UserRole.Member],
        user,
      });
    });

    it("should throw an error when category doesn't exist", async () => {
      jest.spyOn(platformCategoryRepository, 'findOne').mockResolvedValue(null);
      const user = factories.user.build();
      await expect(
        service.create(
          factories.createPlatformDto.build({ category: 'UNKNOWN_CATEGORY' }),
          user.id,
        ),
      ).rejects.toThrow(
        new PlatformCategoryNotFoundException({ name: 'UNKNOWN_CATEGORY' }),
      );
      expect(platformRepository.save).not.toHaveBeenCalled();
      expect(platformRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error when user has too many admin roles', async () => {
      jest
        .spyOn(platformUserCreateQueryBuilder, 'getCount')
        .mockResolvedValue(6);
      const user = factories.user.build();
      await expect(
        service.create(factories.createPlatformDto.build(), user.id),
      ).rejects.toThrow(new MaxAdminRolesPerUserException({ max: 5 }));
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

      expect(platformCreateQueryBuilder.andWhere).toHaveBeenCalledWith(
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

      expect(platformCreateQueryBuilder.andWhere).toHaveBeenCalledWith(
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
      expect(platformCreateQueryBuilder.andWhere).toHaveBeenCalledWith(
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

  describe('findMyPlatforms()', () => {
    it('should find my platforms', async () => {
      const user = factories.user.build();

      expect(
        await service.findMyPlatforms(
          { page: 1, numItemsPerPage: 10 },
          user.id,
        ),
      ).toEqual({
        platforms: [factories.onePlatform.build()],
        totalCount: 1,
      });

      expect(
        platformUserCreateQueryBuilder.leftJoinAndSelect,
      ).toHaveBeenNthCalledWith(1, 'platformUser.platform', 'platform');
      expect(
        platformUserCreateQueryBuilder.leftJoinAndSelect,
      ).toHaveBeenNthCalledWith(2, 'platform.category', 'category');

      expect(platformUserCreateQueryBuilder.orderBy).toHaveBeenCalledWith({
        'platformUser.createdAt': 'DESC',
        'platformUser.id': 'DESC',
      });
    });

    it('should find my platforms with pagination', async () => {
      const user = factories.user.build();

      expect(
        await service.findMyPlatforms({ page: 2, numItemsPerPage: 1 }, user.id),
      ).toEqual({
        platforms: [factories.onePlatform.build()],
        totalCount: 1,
      });

      expect(platformUserCreateQueryBuilder.skip).toHaveBeenCalledWith(1);
      expect(platformUserCreateQueryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should find my platforms with role filter', async () => {
      const user = factories.user.build();

      expect(
        await service.findMyPlatforms(
          {
            page: 1,
            numItemsPerPage: 10,
            role: UserRole.Member,
          },
          user.id,
        ),
      ).toEqual({
        platforms: [factories.onePlatform.build()],
        totalCount: 1,
      });

      expect(platformUserCreateQueryBuilder.andWhere).toHaveBeenCalledWith(
        'JSON_CONTAINS(roles, \'"member"\')',
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

  describe('update()', () => {
    it('should update platform successfully', async () => {
      const updatedCategory = factories.onePlatformCategory.build({
        name: 'CATEGORY_UPDATE',
      });
      const platform = factories.onePlatform.build();
      const updates = {
        name: 'TEST_PLATFORM_UPDATE',
        nameHandle: 'test_platform_update#1',
        category: updatedCategory,
        redirectUris: ['TEST_REDIRECT_URI'],
        activityWebhookUri: 'ACTIVITY_WEBHOOK_URI',
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
});
