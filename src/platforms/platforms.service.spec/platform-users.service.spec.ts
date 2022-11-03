import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

import { Platform } from '../entities/platform.entity';
import { PlatformsService } from '../platforms.service';
import {
  DuplicatePlatformUserException,
  MaxAdminRolesPerUserException,
  PlatformUserNotFoundException,
} from '../exceptions';

import { platformCreateQueryBuilderObject } from './utils';

describe('PlatformsService - Users', () => {
  let service: PlatformsService;
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
            platformUser: {
              count: jest.fn().mockResolvedValue(2),
              findMany: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.buildList(2)),
              delete: jest.fn(),
              create: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.build()),
              findFirst: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.build()),
              update: jest
                .fn()
                .mockResolvedValue(factories.platformUserEntity.build()),
            },
            refreshToken: {
              updateMany: jest.fn(),
            },
            platformCategory: {
              findFirst: jest
                .fn()
                .mockResolvedValue(factories.platformCategoryEntity.build()),
            },
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
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findOnePlatformUser()', () => {
    it('should return one platform user successfully', async () => {
      const platformUser = factories.platformUserEntity.build();
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();

      expect(await service.findOnePlatformUser(platform.id, user.id)).toEqual(
        platformUser,
      );

      expect(prismaService.platformUser.findFirst).toHaveBeenCalledWith({
        where: {
          platformId: platform.id,
          userId: user.id,
        },
        include: {
          user: true,
          platform: {
            include: {
              category: true,
            },
          },
        },
      });
    });

    it('should throw not found error', async () => {
      jest
        .spyOn(prismaService.platformUser, 'findFirst')
        .mockResolvedValue(null);
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();

      await expect(
        async () => await service.findOnePlatformUser(platform.id, user.id),
      ).rejects.toThrow(
        new PlatformUserNotFoundException({
          username: user.userHandle,
          platformName: platform.nameHandle,
        }),
      );
    });
  });

  describe('updateOnePlatformUser()', () => {
    it('should set platform user role successfully', async () => {
      const platformUser = factories.platformUserEntity.build();
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const params = {
        platformId: platform.id,
        userId: user.id,
      };
      const body = {
        roles: [UserRole.Admin, UserRole.Member],
      };

      await service.updateOnePlatformUser(params, body);

      expect(prismaService.platformUser.update).toHaveBeenCalledWith({
        where: {
          id: platformUser.id,
        },
        data: {
          profileUrl: platformUser.profileUrl,
          roles: body.roles,
        },
        include: {
          platform: true,
          user: true,
        },
      });
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { platformUserId: platformUser.id },
        data: { isRevoked: true },
      });
    });

    it('should set profile url', async () => {
      const platformUser = factories.platformUserEntity.build({
        profileUrl: 'NEW_PROFILE_URL',
      });
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const params = {
        platformId: platform.id,
        userId: user.id,
      };
      const body = { profileUrl: 'NEW_PROFILE_URL' };
      await service.updateOnePlatformUser(params, body);

      expect(prismaService.platformUser.update).toHaveBeenCalledWith({
        where: { id: platformUser.id },
        data: {
          profileUrl: 'NEW_PROFILE_URL',
          roles: platformUser.roles,
        },
        include: { platform: true, user: true },
      });
    });

    it('should throw an error when user has too many admin roles', async () => {
      jest.spyOn(prismaService.platformUser, 'count').mockResolvedValue(6);
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const params = {
        platformId: platform.id,
        userId: user.id,
      };
      const body = {
        roles: [UserRole.Admin, UserRole.Member],
      };

      await expect(service.updateOnePlatformUser(params, body)).rejects.toThrow(
        new MaxAdminRolesPerUserException({ max: 5 }),
      );
      expect(prismaService.platformUser.update).not.toHaveBeenCalled();
    });

    it('should not throw an error when setting user to member', async () => {
      jest.spyOn(prismaService.platformUser, 'count').mockResolvedValue(6);
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const params = {
        platformId: platform.id,
        userId: user.id,
      };
      const body = {
        roles: [UserRole.Member],
      };

      await expect(
        service.updateOnePlatformUser(params, body),
      ).resolves.not.toThrow(new MaxAdminRolesPerUserException({ max: 5 }));
      expect(prismaService.platformUser.update).toHaveBeenCalled();
    });
  });

  describe('removeUser()', () => {
    it('should delete user successfully', async () => {
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const platformUser = factories.platformUserEntity.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      await service.removeUser(platform.id, user.id);

      expect(service.findOnePlatformUser).toHaveBeenCalledWith(
        platform.id,
        user.id,
      );
      expect(prismaService.platformUser.delete).toHaveBeenCalledWith({
        where: { id: platformUser.id },
      });
    });
  });

  describe('findAllPlatformUsers()', () => {
    it('should return all platform users successfully', async () => {
      const platform = factories.platformEntity.build();
      const platformUsers = factories.platformUserEntity.buildList(2);
      jest
        .spyOn(prismaService.platformUser, 'findMany')
        .mockResolvedValue(platformUsers);
      jest
        .spyOn(prismaService.platformUser, 'count')
        .mockResolvedValue(platformUsers.length);

      expect(
        await service.findAllPlatformUsers({
          platformId: platform.id,
          params: {
            page: 1,
            numItemsPerPage: 10,
          },
        }),
      ).toEqual({ platformUsers, totalCount: platformUsers.length });

      expect(prismaService.platformUser.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: true, platform: { include: { category: true } } },
        skip: 0,
        take: 10,
        where: { platformId: platform.id },
      });
    });

    it('should filter platform users successfully', async () => {
      const platform = factories.platformEntity.build();
      const platformUsers = factories.platformUserEntity.buildList(1);
      jest
        .spyOn(prismaService.platformUser, 'findMany')
        .mockResolvedValue(platformUsers);

      jest
        .spyOn(prismaService.platformUser, 'count')
        .mockResolvedValue(platformUsers.length);

      expect(
        await service.findAllPlatformUsers({
          platformId: platform.id,
          params: {
            page: 1,
            numItemsPerPage: 10,
            uid: [1],
          },
        }),
      ).toEqual({ platformUsers, totalCount: platformUsers.length });

      expect(prismaService.platformUser.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: true, platform: { include: { category: true } } },
        skip: 0,
        take: 10,
        where: {
          platformId: platform.id,
          userId: { in: [1] },
        },
      });
    });

    it('should return all platform users with pagination successfully', async () => {
      const platform = factories.platformEntity.build();
      const platformUsers = factories.platformUserEntity.buildList(2, {
        platformId: platform.id,
      });
      jest
        .spyOn(prismaService.platformUser, 'findMany')
        .mockResolvedValue([platformUsers[0]]);
      jest
        .spyOn(prismaService.platformUser, 'count')
        .mockResolvedValue(platformUsers.length);

      expect(
        await service.findAllPlatformUsers({
          platformId: platform.id,
          params: {
            page: 1,
            numItemsPerPage: 1,
          },
        }),
      ).toEqual({
        platformUsers: [platformUsers[0]],
        totalCount: platformUsers.length,
      });

      expect(prismaService.platformUser.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: true, platform: { include: { category: true } } },
        skip: 0,
        take: 1,
        where: { platformId: platform.id },
      });
    });
  });

  describe('addUser()', () => {
    it('should add user successfully', async () => {
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const platformUser = factories.platformUserEntity.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      jest
        .spyOn(prismaService.platformUser, 'findFirst')
        .mockResolvedValue(null);
      jest
        .spyOn(prismaService.platformUser, 'create')
        .mockResolvedValue(
          factories.platformUserEntity.build({ roles: [UserRole.Member] }),
        );

      expect(await service.addUser(platform.id, user.id)).toEqual(
        factories.platformUserEntity.build({
          roles: [UserRole.Member],
        }),
      );

      expect(prismaService.platformUser.create).toHaveBeenCalledWith({
        data: {
          platformId: platform.id,
          roles: [UserRole.Member],
          userId: user.id,
        },
        include: {
          platform: {
            include: {
              category: true,
            },
          },
          user: true,
        },
      });
    });

    it('should raise duplicate error', async () => {
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();

      await expect(service.addUser(platform.id, user.id)).rejects.toThrow(
        new DuplicatePlatformUserException(),
      );
    });
  });
});
