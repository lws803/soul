import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not, IsNull, QueryFailedError } from 'typeorm';

import * as factories from 'factories';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UsersService } from 'src/users/users.service';

import { UserConnection } from './entities/user-connection.entity';
import { ConnectionType } from './enums/connection-type.enum';
import { UserConnectionsService } from './user-connections.service';

describe('ConnectionsService', () => {
  let service: UserConnectionsService;
  let userConnectionRepository: Repository<UserConnection>;
  let userService: UsersService;
  let platformService: PlatformsService;

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
              .mockResolvedValue(factories.oneUserConnection.build()),
            findOne: jest
              .fn()
              .mockResolvedValue(factories.oneUserConnection.build()),
            update: jest.fn(),
            findAndCount: jest
              .fn()
              .mockResolvedValue([
                factories.userConnectionArray.build(),
                factories.userConnectionArray.build().length,
              ]),
            delete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
          },
        },
        {
          provide: PlatformsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.onePlatform.build()),
          },
        },
      ],
    }).compile();

    service = module.get<UserConnectionsService>(UserConnectionsService);
    userService = module.get<UsersService>(UsersService);
    platformService = module.get<PlatformsService>(PlatformsService);
    userConnectionRepository = module.get<Repository<UserConnection>>(
      getRepositoryToken(UserConnection),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const firstUser = factories.oneUser.build();
    const secondUser = factories.oneUser.build({
      email: 'TEST_USER_2@EMAIL.COM',
      id: 2,
    });

    beforeEach(() => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(firstUser);
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(secondUser);
      jest.spyOn(userConnectionRepository, 'findOne').mockResolvedValue(null);
    });

    it('should successfully insert a new user connection', async () => {
      const createUserConnectionDto = factories.createUserConnectionDto.build();
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
      const onePlatform = factories.onePlatform.build();
      const createUserConnectionDto = factories.createUserConnectionDto.build({
        platformId: onePlatform.id,
      });

      jest.spyOn(userConnectionRepository, 'save').mockResolvedValue(
        factories.oneUserConnection.build({
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
      const otherUserConnection = factories.oneUserConnection.build({
        fromUser: secondUser,
        toUser: firstUser,
      });
      const createUserConnectionDto = factories.createUserConnectionDto.build();

      jest
        .spyOn(userConnectionRepository, 'findOne')
        .mockResolvedValue(otherUserConnection);
      jest.spyOn(userConnectionRepository, 'save').mockResolvedValue(
        factories.oneUserConnection.build({
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

    it('should throw error when an existing connection exists', async () => {
      const createUserConnectionDto = factories.createUserConnectionDto.build();
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
      const createUserConnectionDto = factories.createUserConnectionDto.build({
        fromUserId: 1,
        toUserId: 1,
      });
      await expect(service.create(1, createUserConnectionDto)).rejects.toThrow(
        'You cannot create a connection to yourself. Please try again.',
      );
    });

    it('should throw error when user is not authorized', async () => {
      const createUserConnectionDto = factories.createUserConnectionDto.build({
        fromUserId: 2,
        toUserId: 3,
      });
      await expect(service.create(1, createUserConnectionDto)).rejects.toThrow(
        'You have no permissions to update this connection.',
      );
    });
  });

  describe('findAll()', () => {
    it('should return a list of user connections with total count', async () => {
      expect(await service.findAll({ numItemsPerPage: 10, page: 1 })).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionArray.build(),
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
        .mockResolvedValue([[factories.oneUserConnection.build()], 1]);
      expect(await service.findAll({ numItemsPerPage: 1, page: 1 })).toEqual({
        totalCount: 1,
        userConnections: [factories.oneUserConnection.build()],
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
        factories.oneUserConnectionResponse.build({ isMutual: true }),
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
      const userConnection = factories.oneUserConnection.build();
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(userConnection.fromUser);
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(userConnection.toUser);

      expect(await service.findOneByUserIds(1, 2)).toEqual(
        factories.oneUserConnectionResponse.build({ isMutual: true }),
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
      const onePlatform = factories.onePlatform.build();
      const oneUserConnectionWithPlatform = factories.oneUserConnection.build({
        platforms: [onePlatform],
      });
      jest
        .spyOn(userConnectionRepository, 'save')
        .mockResolvedValue(oneUserConnectionWithPlatform);

      expect(
        await service.addNewPlatformToUserConnection(1, onePlatform.id, 1),
      ).toEqual(oneUserConnectionWithPlatform);

      expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
      );
      expect(platformService.findOne).toHaveBeenCalledWith(onePlatform.id);
      expect(userConnectionRepository.save).toHaveBeenCalledWith(
        oneUserConnectionWithPlatform,
      );
    });

    it('should throw when user is not involved in the connection', async () => {
      const onePlatform = factories.onePlatform.build();
      await expect(
        service.addNewPlatformToUserConnection(1, onePlatform.id, 2),
      ).rejects.toThrow('You have no permissions to update this connection.');
    });
  });

  describe('removePlatformFromUserConnection()', () => {
    it('should remove a platform from a user connection successfully', async () => {
      const onePlatform = factories.onePlatform.build();
      const oneUserConnection = factories.oneUserConnection.build();
      jest
        .spyOn(userConnectionRepository, 'save')
        .mockResolvedValue(oneUserConnection);

      expect(
        await service.removePlatformFromUserConnection(1, onePlatform.id, 1),
      ).toBeUndefined();

      expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
      );
      expect(platformService.findOne).toHaveBeenCalledWith(onePlatform.id);
      expect(userConnectionRepository.save).toHaveBeenCalledWith(
        oneUserConnection,
      );
    });

    it('should throw when user is not involved in the connection', async () => {
      const onePlatform = factories.onePlatform.build();
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
        userConnections: factories.userConnectionArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        where: { fromUser: factories.oneUser.build() },
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
        userConnections: factories.userConnectionArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        where: { toUser: factories.oneUser.build() },
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
        userConnections: factories.userConnectionArray.build(),
      });

      expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          fromUser: factories.oneUser.build(),
          mutualConnection: Not(IsNull()),
        },
        ...defaultQueryParameters,
      });
    });
  });
});
