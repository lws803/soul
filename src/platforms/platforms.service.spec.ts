import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { Platform } from './entities/platform.entity';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformsService } from './platforms.service';
import { DuplicatePlatformUserException } from './exceptions';

describe('PlatformsService', () => {
  let service: PlatformsService;
  let platformRepository: Repository<Platform>;
  let platformUserRepository: Repository<PlatformUser>;
  let refreshTokenRepository: Repository<RefreshToken>;

  beforeEach(async () => {
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
                factories.onePlatformUser.build({ roles: [UserRole.MEMBER] }),
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
      });
      expect(platformRepository.update).toHaveBeenCalledWith(
        { id: platform.id },
        { nameHandle: 'TEST_PLATFORM#1' },
      );
      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform,
        roles: [UserRole.ADMIN, UserRole.MEMBER],
        user,
      });
    });
  });

  describe('findAll()', () => {
    it('should find all platforms', async () => {
      const platforms = factories.platformArray.build();

      expect(await service.findAll({ page: 1, numItemsPerPage: 10 })).toEqual({
        platforms,
        totalCount: platforms.length,
      });

      expect(platformRepository.findAndCount).toHaveBeenCalledWith({
        where: [{ isVerified: true }, { isVerified: false }],
        order: {
          id: 'ASC',
        },
        take: 10,
        skip: 0,
      });
    });

    it('should find all platforms with pagination', async () => {
      const platforms = factories.platformArray.build();
      jest
        .spyOn(platformRepository, 'findAndCount')
        .mockResolvedValue([[platforms[0]], platforms.length]);

      expect(await service.findAll({ page: 1, numItemsPerPage: 1 })).toEqual({
        platforms: [platforms[0]],
        totalCount: platforms.length,
      });

      expect(platformRepository.findAndCount).toHaveBeenCalledWith({
        where: [{ isVerified: true }, { isVerified: false }],
        order: {
          id: 'ASC',
        },
        take: 1,
        skip: 0,
      });
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

      expect(platformRepository.findAndCount).toHaveBeenCalledWith({
        where: { isVerified: true },
        order: {
          id: 'ASC',
        },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('findOne()', () => {
    it('should return one platform successfully', async () => {
      const platform = factories.onePlatform.build();

      expect(await service.findOne(platform.id)).toEqual(platform);

      expect(platformRepository.findOne).toHaveBeenCalledWith(platform.id, {
        relations: ['userConnections'],
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
      const platform = factories.onePlatform.build();
      const updates = {
        name: 'TEST_PLATFORM_UPDATE',
        nameHandle: 'TEST_PLATFORM_UPDATE#1',
      };
      const updatedPlatform = factories.onePlatform.build(updates);
      jest
        .spyOn(platformRepository, 'findOne')
        .mockResolvedValue(updatedPlatform);

      expect(
        await service.update(platform.id, factories.updatePlatformDto.build()),
      ).toEqual(updatedPlatform);

      expect(platformRepository.update).toHaveBeenCalledWith(
        { id: platform.id },
        updates,
      );
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
        UserRole.ADMIN,
        UserRole.MEMBER,
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
          roles: [UserRole.MEMBER],
        }),
      );

      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform: factories.onePlatform.build(),
        roles: [UserRole.MEMBER],
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
