import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

import { Platform } from '../entities/platform.entity';
import { PlatformsService } from '../platforms.service';
import {
  MaxAdminRolesPerUserException,
  PlatformCategoryNotFoundException,
} from '../exceptions';
import { CreatePlatformDto, UpdatePlatformDto } from '../serializers/api.dto';

import { platformCreateQueryBuilderObject } from './utils';

describe('PlatformsService', () => {
  let service: PlatformsService;
  let platformRepository: Repository<Platform>;
  let platformCreateQueryBuilder: any;
  let prismaService: PrismaService;

  beforeEach(async () => {
    platformCreateQueryBuilder = platformCreateQueryBuilderObject;

    const platforms = factories.platformEntity.buildList(2);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformsService,
        {
          provide: getRepositoryToken(Platform),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.platformEntity.build()),
            findAndCount: jest
              .fn()
              .mockResolvedValue([platforms, platforms.length]),
            save: jest.fn().mockResolvedValue(factories.platformEntity.build()),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => platformCreateQueryBuilder),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            platformCategory: {
              findFirst: jest
                .fn()
                .mockResolvedValue(factories.platformCategoryEntity.build()),
            },
            platformUser: {
              findFirst: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.build()),
              findMany: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.buildList(2)),
              count: jest.fn().mockResolvedValue(2),
              create: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.build()),
              delete: jest.fn(),
              update: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.build()),
            },
            refreshToken: { updateMany: jest.fn() },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.userEntity.build()),
          },
        },
      ],
    }).compile();

    service = module.get<PlatformsService>(PlatformsService);
    platformRepository = module.get<Repository<Platform>>(
      getRepositoryToken(Platform),
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create()', () => {
    it('should create a platform successfully', async () => {
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();

      const newPlatform = await service.create(
        plainToClass(
          CreatePlatformDto,
          factories.createPlatformRequest.build(),
        ),
        user.id,
      );

      expect(newPlatform).toEqual(platform);

      expect(platformRepository.save).toHaveBeenCalledWith({
        name: 'TEST_PLATFORM',
        redirectUris: ['TEST_REDIRECT_URI'],
        category: factories.platformCategoryEntity.build(),
        activityWebhookUri: 'ACTIVITY_WEBHOOK_URI',
        homepageUrl: 'HOMEPAGE_URL',
      });
      expect(platformRepository.update).toHaveBeenCalledWith(
        { id: platform.id },
        { nameHandle: 'test_platform#1' },
      );
      expect(prismaService.platformUser.create).toHaveBeenCalledWith({
        data: {
          platformId: platform.id,
          roles: [UserRole.Admin, UserRole.Member],
          userId: user.id,
        },
      });
    });

    it("should throw an error when category doesn't exist", async () => {
      jest
        .spyOn(prismaService.platformCategory, 'findFirst')
        .mockResolvedValue(null);
      const user = factories.userEntity.build();
      await expect(
        service.create(
          plainToClass(
            CreatePlatformDto,
            factories.createPlatformRequest.build({
              category: 'UNKNOWN_CATEGORY',
            }),
          ),
          user.id,
        ),
      ).rejects.toThrow(
        new PlatformCategoryNotFoundException({ name: 'UNKNOWN_CATEGORY' }),
      );
      expect(platformRepository.save).not.toHaveBeenCalled();
      expect(platformRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error when user has too many admin roles', async () => {
      jest.spyOn(prismaService.platformUser, 'count').mockResolvedValue(6);
      const user = factories.userEntity.build();
      await expect(
        service.create(
          plainToClass(
            CreatePlatformDto,
            factories.createPlatformRequest.build(),
          ),
          user.id,
        ),
      ).rejects.toThrow(new MaxAdminRolesPerUserException({ max: 5 }));
      expect(platformRepository.save).not.toHaveBeenCalled();
      expect(platformRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should find all platforms', async () => {
      const platforms = factories.platformEntity.buildList(2);

      expect(await service.findAll({ page: 1, numItemsPerPage: 10 })).toEqual({
        platforms,
        totalCount: platforms.length,
      });
    });

    it('should find all platforms with pagination', async () => {
      const platforms = factories.platformEntity.buildList(2);
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
      const platforms = factories.platformEntity.buildList(2);

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
      const platforms = factories.platformEntity.buildList(2);

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
      const platforms = factories.platformEntity.buildList(2);

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

      expect(prismaService.platformCategory.findFirst).toHaveBeenCalledWith({
        where: { name: 'CATEGORY' },
      });
      expect(platformCreateQueryBuilder.andWhere).toHaveBeenCalledWith(
        'platform.category = :categoryId',
        { categoryId: factories.platformCategoryEntity.build().id },
      );
    });

    it('should throw if the filtering category does not exist', async () => {
      jest
        .spyOn(prismaService.platformCategory, 'findFirst')
        .mockResolvedValue(null);
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
      const user = factories.userEntity.build();
      jest.spyOn(prismaService.platformUser, 'findMany').mockResolvedValue([
        {
          ...factories.platformUserEntity.build(),
          platform: factories.platformEntity.build(),
        } as any,
      ]);
      jest.spyOn(prismaService.platformUser, 'count').mockResolvedValue(1);

      expect(
        await service.findMyPlatforms(
          { page: 1, numItemsPerPage: 10 },
          user.id,
        ),
      ).toEqual({
        platforms: factories.platformEntity.buildList(1),
        totalCount: 1,
      });

      expect(prismaService.platformUser.findMany).toHaveBeenCalledWith({
        include: { platform: { include: { category: true } }, user: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 10,
        where: { userId: user.id },
      });
    });

    it('should find my platforms with pagination', async () => {
      const user = factories.userEntity.build();
      jest.spyOn(prismaService.platformUser, 'findMany').mockResolvedValue([
        {
          ...factories.platformUserEntity.build(),
          platform: factories.platformEntity.build(),
        } as any,
      ]);
      jest.spyOn(prismaService.platformUser, 'count').mockResolvedValue(1);

      expect(
        await service.findMyPlatforms({ page: 2, numItemsPerPage: 1 }, user.id),
      ).toEqual({
        platforms: factories.platformEntity.buildList(1),
        totalCount: 1,
      });

      expect(prismaService.platformUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 1, take: 1 }),
      );
    });

    it('should find my platforms with role filter', async () => {
      const user = factories.userEntity.build();
      jest.spyOn(prismaService.platformUser, 'findMany').mockResolvedValue([
        {
          ...factories.platformUserEntity.build(),
          platform: factories.platformEntity.build(),
        } as any,
      ]);
      jest.spyOn(prismaService.platformUser, 'count').mockResolvedValue(1);

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
        platforms: factories.platformEntity.buildList(1),
        totalCount: 1,
      });

      expect(prismaService.platformUser.findMany).toHaveBeenCalledWith({
        include: { platform: { include: { category: true } }, user: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 10,
        where: { roles: { array_contains: 'member' }, userId: user.id },
      });
    });
  });

  describe('findOne()', () => {
    it('should return one platform successfully', async () => {
      const platform = factories.platformEntity.build();

      expect(await service.findOne(platform.id)).toEqual(platform);

      expect(platformRepository.findOne).toHaveBeenCalledWith(platform.id, {
        relations: ['userConnections', 'category'],
      });
    });

    it('should throw not found error', async () => {
      jest.spyOn(platformRepository, 'findOne').mockResolvedValue(null);
      const platform = factories.platformEntity.build();

      await expect(
        async () => await service.findOne(platform.id),
      ).rejects.toThrow(
        'The platform with id: 1 was not found, please try again.',
      );
    });
  });

  describe('update()', () => {
    it('should update platform successfully', async () => {
      const updatedCategory = factories.platformCategoryEntity.build({
        name: 'CATEGORY_UPDATE',
      });
      const platform = factories.platformEntity.build();
      const updates = {
        name: 'TEST_PLATFORM_UPDATE',
        nameHandle: 'test_platform_update#1',
        category: updatedCategory,
        redirectUris: ['TEST_REDIRECT_URI'],
        activityWebhookUri: 'ACTIVITY_WEBHOOK_URI',
        homepageUrl: 'HOMEPAGE_URL',
      };
      const updatedPlatform = factories.platformEntity.build(updates);

      jest
        .spyOn(platformRepository, 'findOne')
        .mockResolvedValue(updatedPlatform);
      jest
        .spyOn(prismaService.platformCategory, 'findFirst')
        .mockResolvedValue(updatedCategory);

      expect(
        await service.update(
          platform.id,
          plainToClass(
            UpdatePlatformDto,
            factories.updatePlatformRequest.build(),
          ),
        ),
      ).toEqual(updatedPlatform);

      expect(prismaService.platformCategory.findFirst).toHaveBeenCalledWith({
        where: { name: 'CATEGORY_UPDATE' },
      });

      expect(platformRepository.update).toHaveBeenCalledWith(
        { id: platform.id },
        updates,
      );
    });

    it("should throw an error when category doesn't exist", async () => {
      jest
        .spyOn(prismaService.platformCategory, 'findFirst')
        .mockResolvedValue(null);
      const platform = factories.platformEntity.build();
      await expect(
        service.update(
          platform.id,
          plainToClass(
            UpdatePlatformDto,
            factories.updatePlatformRequest.build(),
          ),
        ),
      ).rejects.toThrow(
        'The category with name: CATEGORY_UPDATE was not found, please try again.',
      );
      expect(platformRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('should remove platform successfully', async () => {
      const platform = factories.platformEntity.build();

      await service.remove(platform.id);

      expect(platformRepository.delete).toHaveBeenCalledWith({
        id: platform.id,
      });
    });
  });

  describe('generateClientSecret()', () => {
    it('should generate new client secret successfully', async () => {
      const platform = factories.platformEntity.build();

      await service.generateClientSecret(platform.id);

      expect(platformRepository.save).toHaveBeenCalledWith({
        ...platform,
        clientSecret: expect.any(String),
      });
    });
  });
});
