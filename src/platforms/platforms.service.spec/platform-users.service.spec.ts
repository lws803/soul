import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository, In } from 'typeorm';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PrismaService } from 'src/prisma/prisma.service';

import { Platform } from '../entities/platform.entity';
import { PlatformUser } from '../entities/platform-user.entity';
import { PlatformsService } from '../platforms.service';
import {
  DuplicatePlatformUserException,
  MaxAdminRolesPerUserException,
  PlatformUserNotFoundException,
} from '../exceptions';

import { platformCreateQueryBuilderObject } from './utils';

describe('PlatformsService - Users', () => {
  let service: PlatformsService;
  let platformUserRepository: Repository<PlatformUser>;
  let refreshTokenRepository: Repository<RefreshToken>;
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
              count: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
            },
            refreshToken: {
              updateMany: jest.fn(),
            },
            platformCategory: {
              findFirst: jest.fn(),
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

      expect(platformUserRepository.findOne).toHaveBeenCalledWith(
        {
          user,
          platform,
        },
        { relations: ['user', 'platform', 'platform.category'] },
      );
    });

    it('should throw not found error', async () => {
      jest.spyOn(platformUserRepository, 'findOne').mockResolvedValue(null);
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

      expect(platformUserRepository.save).toHaveBeenCalledWith(platformUser);
      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        platformUser,
      });
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { platformUser },
        { isRevoked: true },
      );
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

      expect(platformUserRepository.save).toHaveBeenCalledWith(platformUser);
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
      expect(platformUserRepository.save).not.toHaveBeenCalled();
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
      expect(platformUserRepository.save).toHaveBeenCalled();
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
      expect(platformUserRepository.delete).toHaveBeenCalledWith({
        id: platformUser.id,
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

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
        relations: ['user', 'platform'],
        skip: 0,
        take: 10,
        where: {
          platform,
        },
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

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
        relations: ['user', 'platform'],
        skip: 0,
        take: 10,
        where: {
          platform,
          user: In([1]),
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

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
        relations: ['user', 'platform'],
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
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();
      const platformUser = factories.platformUserEntity.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      expect(await service.addUser(platform.id, user.id)).toEqual(
        factories.platformUserEntity.build({
          roles: [UserRole.Member],
        }),
      );

      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform: factories.platformEntity.build(),
        roles: [UserRole.Member],
        user: factories.userEntity.build(),
      });
    });

    it('should raise duplicate error', async () => {
      const platform = factories.platformEntity.build();
      const user = factories.userEntity.build();

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
