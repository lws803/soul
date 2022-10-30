import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not, IsNull, QueryFailedError } from 'typeorm';
import { plainToClass } from 'class-transformer';

import * as factories from 'factories';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UsersService } from 'src/users/users.service';
import { ActivityService } from 'src/activity/activity.service';

import { UserConnection } from './entities/user-connection.entity';
import { ConnectionType } from './enums/connection-type.enum';
import { UserConnectionsService } from './user-connections.service';
import { CreateUserConnectionDto } from './serializers/api.dto';

describe('ConnectionsService', () => {
  let service: UserConnectionsService;
  let userConnectionRepository: Repository<UserConnection>;
  let userService: UsersService;
  let platformService: PlatformsService;
  let activityService: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConnectionsService,
        {
          provide: getRepositoryToken(UserConnection),
          useValue: {
            find: jest.fn(),
            save: jest
              .fn()
              .mockResolvedValue(factories.userConnectionEntity.build()),
            findOne: jest
              .fn()
              .mockResolvedValue(factories.userConnectionEntity.build()),
            update: jest.fn(),
            findAndCount: jest
              .fn()
              .mockResolvedValue([
                factories.userConnectionEntityArray.build(),
                factories.userConnectionEntityArray.build().length,
              ]),
            delete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.userEntity.build()),
          },
        },
        {
          provide: PlatformsService,
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.platformEntity.build()),
          },
        },
        {
          provide: ActivityService,
          useValue: { sendFollowActivity: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserConnectionsService>(UserConnectionsService);
    userService = module.get<UsersService>(UsersService);
    platformService = module.get<PlatformsService>(PlatformsService);
    userConnectionRepository = module.get<Repository<UserConnection>>(
      getRepositoryToken(UserConnection),
    );
    activityService = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const firstUser = factories.userEntity.build();
    const secondUser = factories.userEntity.build({
      email: 'TEST_USER_2@EMAIL.COM',
      id: 2,
    });

    beforeEach(() => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(firstUser);
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(secondUser);
      jest.spyOn(userConnectionRepository, 'findOne').mockResolvedValue(null);
    });

    it('should successfully insert a new user connection', async () => {
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );
      expect(await service.create(1, createUserConnectionDto)).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        fromUser: firstUser,
        toUser: secondUser,
        id: 1,
        isMutual: false,
        mutualConnection: null,
        platforms: [],
      });

      // Finds mutual connection
      expect(userConnectionRepository.findOne).toHaveBeenCalledWith({
        fromUser: secondUser,
        toUser: firstUser,
      });
      expect(userConnectionRepository.save).toHaveBeenCalledWith({
        fromUser: firstUser,
        toUser: secondUser,
      });
    });

    it('should successfully insert a new user connection with platformId', async () => {
      const onePlatform = factories.platformEntity.build();
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build({
          platform_id: onePlatform.id,
        }),
      );

      jest.spyOn(userConnectionRepository, 'save').mockResolvedValue(
        factories.userConnectionEntity.build({
          platforms: [onePlatform],
        }),
      );
      expect(await service.create(1, createUserConnectionDto)).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        fromUser: firstUser,
        toUser: secondUser,
        id: 1,
        isMutual: false,
        mutualConnection: null,
        platforms: [onePlatform],
      });
      // Finds mutual connection
      expect(userConnectionRepository.findOne).toHaveBeenCalledWith({
        fromUser: secondUser,
        toUser: firstUser,
      });
      expect(userConnectionRepository.save).toHaveBeenCalledWith({
        fromUser: firstUser,
        toUser: secondUser,
        platforms: [onePlatform],
      });
    });

    it('should successfully insert a new user connection with mutual connection', async () => {
      const otherUserConnection = factories.userConnectionEntity.build({
        fromUser: secondUser,
        toUser: firstUser,
      });
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );

      jest
        .spyOn(userConnectionRepository, 'findOne')
        .mockResolvedValue(otherUserConnection);
      jest.spyOn(userConnectionRepository, 'save').mockResolvedValue(
        factories.userConnectionEntity.build({
          mutualConnection: otherUserConnection,
        }),
      );

      expect(await service.create(1, createUserConnectionDto)).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        fromUser: firstUser,
        toUser: secondUser,
        id: 1,
        isMutual: true,
        mutualConnection: otherUserConnection,
        platforms: [],
      });

      expect(userConnectionRepository.save).toHaveBeenCalledWith({
        fromUser: firstUser,
        toUser: secondUser,
      });
      // Finds mutual connection
      expect(userConnectionRepository.findOne).toHaveBeenCalledWith({
        fromUser: secondUser,
        toUser: firstUser,
      });
      expect(userConnectionRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { mutualConnection: otherUserConnection },
      );
    });

    it('should send follow activity when inserting a new user connection', async () => {
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );
      await service.create(1, createUserConnectionDto);

      expect(activityService.sendFollowActivity).toHaveBeenCalledWith({
        fromUser: firstUser,
        toUser: secondUser,
      });
    });

    it('should throw error when an existing connection exists', async () => {
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );
      jest
        .spyOn(userConnectionRepository, 'save')
        .mockRejectedValue(
          new QueryFailedError('', [], { code: 'ER_DUP_ENTRY' }),
        );

      await expect(service.create(1, createUserConnectionDto)).rejects.toThrow(
        'A user connection from id: 1 to id: 2 already exists',
      );
    });

    it('should throw error when trying to create a connection to self', async () => {
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build({
          to_user_id: 1,
        }),
      );
      await expect(service.create(1, createUserConnectionDto)).rejects.toThrow(
        'You cannot create a connection to yourself. Please try again.',
      );
    });

    it('does not send follow activity when error is thrown', async () => {
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );
      jest
        .spyOn(userConnectionRepository, 'save')
        .mockRejectedValue(
          new QueryFailedError('', [], { code: 'ER_DUP_ENTRY' }),
        );
      await expect(service.create(1, createUserConnectionDto)).rejects.toThrow(
        'A user connection from id: 1 to id: 2 already exists',
      );

      expect(activityService.sendFollowActivity).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should return a list of user connections with total count', async () => {
      expect(await service.findAll({ numItemsPerPage: 10, page: 1 })).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionEntityArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
        relations: ['platforms', 'fromUser', 'toUser'],
        skip: 0,
        take: 10,
      });
    });

    it('should paginate correctly', async () => {
      jest
        .spyOn(userConnectionRepository, 'findAndCount')
        .mockResolvedValue([factories.userConnectionEntity.buildList(1), 1]);
      expect(await service.findAll({ numItemsPerPage: 1, page: 1 })).toEqual({
        totalCount: 1,
        userConnections: factories.userConnectionEntity.buildList(1),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
        relations: ['platforms', 'fromUser', 'toUser'],
        skip: 0,
        take: 1,
      });
    });
  });

  describe('findOne()', () => {
    it('should return one user connection successfully', async () => {
      expect(await service.findOne(1)).toEqual(
        factories.oneUserConnectionResponseEntity.build({ isMutual: true }),
      );
      expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
      );
    });

    it('should throw when connection is not found', async () => {
      jest.spyOn(userConnectionRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(
        'User connection with id: 999 not found',
      );
    });
  });

  describe('findOneByUserIds()', () => {
    it('should return one user connection successfully', async () => {
      const userConnection = factories.userConnectionEntity.build();
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(factories.userEntity.build());
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(
          factories.userEntity.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
        );

      expect(await service.findOneByUserIds(1, 2)).toEqual(
        factories.oneUserConnectionResponseEntity.build({ isMutual: true }),
      );
      expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
        { fromUser: userConnection.fromUser, toUser: userConnection.toUser },
        { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
      );
    });
  });

  describe('remove()', () => {
    it('should remove a user connection successfully', async () => {
      expect(await service.remove(1, 1)).toBeUndefined();
      expect(userConnectionRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw when user is not involved in the connection', async () => {
      await expect(service.remove(1, 2)).rejects.toThrow(
        'You have no permissions to update this connection.',
      );
    });
  });

  describe('addNewPlatformToUserConnection()', () => {
    it('should add a new platform to a user connection successfully', async () => {
      const onePlatform = factories.platformEntity.build();
      const userConnectionEntityWithPlatform =
        factories.userConnectionEntity.build({
          platforms: [onePlatform],
        });
      jest
        .spyOn(userConnectionRepository, 'save')
        .mockResolvedValue(userConnectionEntityWithPlatform);

      expect(
        await service.addNewPlatformToUserConnection(1, onePlatform.id, 1),
      ).toEqual(userConnectionEntityWithPlatform);

      expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
      );
      expect(platformService.findOne).toHaveBeenCalledWith(onePlatform.id);
      expect(userConnectionRepository.save).toHaveBeenCalledWith(
        userConnectionEntityWithPlatform,
      );
    });

    it('should throw when user is not involved in the connection', async () => {
      const onePlatform = factories.platformEntity.build();
      await expect(
        service.addNewPlatformToUserConnection(1, onePlatform.id, 2),
      ).rejects.toThrow('You have no permissions to update this connection.');
    });
  });

  describe('removePlatformFromUserConnection()', () => {
    it('should remove a platform from a user connection successfully', async () => {
      const onePlatform = factories.platformEntity.build();
      const userConnectionEntity = factories.userConnectionEntity.build();
      jest
        .spyOn(userConnectionRepository, 'save')
        .mockResolvedValue(userConnectionEntity);

      expect(
        await service.removePlatformFromUserConnection(1, onePlatform.id, 1),
      ).toBeUndefined();

      expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
      );
      expect(platformService.findOne).toHaveBeenCalledWith(onePlatform.id);
      expect(userConnectionRepository.save).toHaveBeenCalledWith(
        userConnectionEntity,
      );
    });

    it('should throw when user is not involved in the connection', async () => {
      const onePlatform = factories.platformEntity.build();
      await expect(
        service.removePlatformFromUserConnection(1, onePlatform.id, 2),
      ).rejects.toThrow('You have no permissions to update this connection.');
    });
  });

  describe('findMyUserConnections()', () => {
    const defaultQueryParameters = {
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'],
      skip: 0,
      take: 10,
    };

    it('should return a list of user connections (my follows) with total count', async () => {
      expect(
        await service.findMyUserConnections({
          userId: 1,
          connectionType: ConnectionType.Following,
          paginationParams: {
            numItemsPerPage: 10,
            page: 1,
          },
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionEntityArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        where: { fromUser: factories.userEntity.build() },
        ...defaultQueryParameters,
      });
    });

    it('should return a list of user connections (my followers) with total count', async () => {
      expect(
        await service.findMyUserConnections({
          userId: 1,
          connectionType: ConnectionType.Follower,
          paginationParams: {
            numItemsPerPage: 10,
            page: 1,
          },
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionEntityArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        where: { toUser: factories.userEntity.build() },
        ...defaultQueryParameters,
      });
    });

    it('should return a list of user connections (mutual friends) with total count', async () => {
      expect(
        await service.findMyUserConnections({
          userId: 1,
          connectionType: ConnectionType.Mutual,
          paginationParams: {
            numItemsPerPage: 10,
            page: 1,
          },
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionEntityArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          fromUser: factories.userEntity.build(),
          mutualConnection: Not(IsNull()),
        },
        ...defaultQueryParameters,
      });
    });
  });
});
