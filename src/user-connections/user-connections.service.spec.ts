import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { ActivityService } from 'src/activity/activity.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { ConnectionType } from './enums/connection-type.enum';
import { UserConnectionsService } from './user-connections.service';
import { CreateUserConnectionDto } from './serializers/api.dto';

describe('ConnectionsService', () => {
  let service: UserConnectionsService;
  let userService: UsersService;
  let activityService: ActivityService;
  let prismaService: PrismaService;

  const firstUser = factories.userEntity.build();
  const secondUser = factories.userEntity.build({
    email: 'TEST_USER_2@EMAIL.COM',
    id: 2,
  });
  const fullUserConnectionWithRelations =
    factories.userConnectionEntity.build();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConnectionsService,
        {
          provide: PrismaService,
          useValue: {
            userConnection: {
              findMany: jest
                .fn()
                .mockResolvedValue(factories.userConnectionEntityArray.build()),
              count: jest.fn().mockResolvedValue(2),
              findFirst: jest
                .fn()
                .mockResolvedValue(fullUserConnectionWithRelations),
              delete: jest.fn(),
              create: jest
                .fn()
                .mockResolvedValue(fullUserConnectionWithRelations),
              update: jest
                .fn()
                .mockResolvedValue(fullUserConnectionWithRelations),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(firstUser),
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
    activityService = module.get<ActivityService>(ActivityService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create()', () => {
    beforeEach(() => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(firstUser);
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(secondUser);
      jest
        .spyOn(prismaService.userConnection, 'findFirst')
        .mockResolvedValue(null);
    });

    it('should successfully insert a new user connection', async () => {
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );
      expect(await service.create(1, createUserConnectionDto)).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        id: 1,
        isMutual: false,
        fromUserId: firstUser.id,
        toUserId: secondUser.id,
        oppositeUserConnectionId: null,
      });

      // Finds mutual connection
      expect(prismaService.userConnection.findFirst).toHaveBeenCalledWith({
        where: {
          fromUser: secondUser,
          toUser: firstUser,
        },
      });
    });

    it('should successfully insert a new user connection with mutual connection', async () => {
      const otherUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: secondUser.id,
        toUserId: firstUser.id,
      });
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );

      jest
        .spyOn(prismaService.userConnection, 'findFirst')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(otherUserConnection);

      jest.spyOn(prismaService.userConnection, 'update').mockResolvedValue({
        ...fullUserConnectionWithRelations,
        oppositeUserConnectionId: otherUserConnection.id,
      });

      jest.spyOn(prismaService.userConnection, 'create').mockResolvedValue(
        factories.userConnectionEntity.build({
          oppositeUserConnectionId: otherUserConnection.id,
        }),
      );

      expect(await service.create(1, createUserConnectionDto)).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        fromUserId: firstUser.id,
        toUserId: secondUser.id,
        id: 1,
        oppositeUserConnectionId: otherUserConnection.id,
        isMutual: true,
      });

      expect(prismaService.userConnection.create).toHaveBeenCalledWith({
        data: {
          fromUserId: firstUser.id,
          toUserId: secondUser.id,
        },
        include: {
          fromUser: true,
          toUser: true,
        },
      });
      // Finds mutual connection
      expect(prismaService.userConnection.findFirst).toHaveBeenCalledWith({
        where: {
          fromUser: secondUser,
          toUser: firstUser,
        },
      });
      expect(prismaService.userConnection.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { oppositeUserConnectionId: otherUserConnection.id },
      });
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
        .spyOn(prismaService.userConnection, 'findFirst')
        .mockResolvedValue(factories.userConnectionEntity.build());

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
        .spyOn(prismaService.userConnection, 'findFirst')
        .mockResolvedValue(factories.userConnectionEntity.build());

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

      expect(prismaService.userConnection.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { fromUser: true, toUser: true },
        skip: 0,
        take: 10,
      });
      expect(prismaService.userConnection.count).toHaveBeenCalled();
    });

    it('should paginate correctly', async () => {
      jest
        .spyOn(prismaService.userConnection, 'findMany')
        .mockResolvedValue(factories.userConnectionEntity.buildList(1));
      jest.spyOn(prismaService.userConnection, 'count').mockResolvedValue(1);

      expect(await service.findAll({ numItemsPerPage: 1, page: 1 })).toEqual({
        totalCount: 1,
        userConnections: factories.userConnectionEntity.buildList(1),
      });

      expect(prismaService.userConnection.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { fromUser: true, toUser: true },
        skip: 0,
        take: 1,
      });
    });
  });

  // describe('findOne()', () => {
  //   it('should return one user connection successfully', async () => {
  //     expect(await service.findOne(1)).toEqual(
  //       factories.oneUserConnectionResponseEntity.build({ isMutual: true }),
  //     );
  //     expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
  //       { id: 1 },
  //       { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
  //     );
  //   });

  //   it('should throw when connection is not found', async () => {
  //     jest.spyOn(userConnectionRepository, 'findOne').mockResolvedValue(null);
  //     await expect(service.findOne(999)).rejects.toThrow(
  //       'User connection with id: 999 not found',
  //     );
  //   });
  // });

  // describe('findOneByUserIds()', () => {
  //   it('should return one user connection successfully', async () => {
  //     const userConnection = factories.userConnectionEntity.build();
  //     jest
  //       .spyOn(userService, 'findOne')
  //       .mockResolvedValueOnce(factories.userEntity.build());
  //     jest
  //       .spyOn(userService, 'findOne')
  //       .mockResolvedValueOnce(
  //         factories.userEntity.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
  //       );

  //     expect(await service.findOneByUserIds(1, 2)).toEqual(
  //       factories.oneUserConnectionResponseEntity.build({ isMutual: true }),
  //     );
  //     expect(userConnectionRepository.findOne).toHaveBeenCalledWith(
  //       { fromUser: userConnection.fromUser, toUser: userConnection.toUser },
  //       { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
  //     );
  //   });
  // });

  // describe('remove()', () => {
  //   it('should remove a user connection successfully', async () => {
  //     expect(await service.remove(1, 1)).toBeUndefined();
  //     expect(userConnectionRepository.delete).toHaveBeenCalledWith({ id: 1 });
  //   });

  //   it('should throw when user is not involved in the connection', async () => {
  //     await expect(service.remove(1, 2)).rejects.toThrow(
  //       'You have no permissions to update this connection.',
  //     );
  //   });
  // });

  // describe('findMyUserConnections()', () => {
  //   const defaultQueryParameters = {
  //     order: {
  //       createdAt: 'DESC',
  //       id: 'DESC',
  //     },
  //     relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'],
  //     skip: 0,
  //     take: 10,
  //   };

  //   it('should return a list of user connections (my follows) with total count', async () => {
  //     expect(
  //       await service.findMyUserConnections({
  //         userId: 1,
  //         connectionType: ConnectionType.Following,
  //         paginationParams: {
  //           numItemsPerPage: 10,
  //           page: 1,
  //         },
  //       }),
  //     ).toEqual({
  //       totalCount: 2,
  //       userConnections: factories.userConnectionEntityArray.build(),
  //     });

  //     expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
  //       where: { fromUser: factories.userEntity.build() },
  //       ...defaultQueryParameters,
  //     });
  //   });

  //   it('should return a list of user connections (my followers) with total count', async () => {
  //     expect(
  //       await service.findMyUserConnections({
  //         userId: 1,
  //         connectionType: ConnectionType.Follower,
  //         paginationParams: {
  //           numItemsPerPage: 10,
  //           page: 1,
  //         },
  //       }),
  //     ).toEqual({
  //       totalCount: 2,
  //       userConnections: factories.userConnectionEntityArray.build(),
  //     });

  //     expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
  //       where: { toUser: factories.userEntity.build() },
  //       ...defaultQueryParameters,
  //     });
  //   });

  //   it('should return a list of user connections (mutual friends) with total count', async () => {
  //     expect(
  //       await service.findMyUserConnections({
  //         userId: 1,
  //         connectionType: ConnectionType.Mutual,
  //         paginationParams: {
  //           numItemsPerPage: 10,
  //           page: 1,
  //         },
  //       }),
  //     ).toEqual({
  //       totalCount: 2,
  //       userConnections: factories.userConnectionEntityArray.build(),
  //     });

  //     expect(userConnectionRepository.findAndCount).toHaveBeenCalledWith({
  //       where: {
  //         fromUser: factories.userEntity.build(),
  //         mutualConnection: Not(IsNull()),
  //       },
  //       ...defaultQueryParameters,
  //     });
  //   });
  // });
});
