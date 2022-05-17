import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { ConnectionType } from './enums/connection-type.enum';
import { UserConnectionsController } from './user-connections.controller';
import { UserConnectionsService } from './user-connections.service';

describe('ConnectionsController', () => {
  let controller: UserConnectionsController;
  let service: UserConnectionsService;

  const userJwt = { user: factories.jwtPayload.build() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserConnectionsController],
      providers: [
        {
          provide: UserConnectionsService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              ...factories.oneUserConnection.build(),
              isMutual: false,
            }),
            findAll: jest.fn().mockResolvedValue({
              totalCount: factories.userConnectionArray.build().length,
              userConnections: factories.userConnectionArray.build(),
            }),
            findMyUserConnections: jest.fn().mockResolvedValue({
              totalCount: factories.userConnectionArray.build().length,
              userConnections: factories.userConnectionArray.build(),
            }),
            findOneByUserIds: jest
              .fn()
              .mockResolvedValue(factories.oneUserConnection.build()),
            findOne: jest
              .fn()
              .mockResolvedValue(factories.oneUserConnection.build()),
            remove: jest.fn(),
            addNewPlatformToUserConnection: jest.fn().mockResolvedValue(
              factories.oneUserConnection.build({
                platforms: [factories.onePlatform.build()],
              }),
            ),
            removePlatformFromUserConnection: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserConnectionsController>(
      UserConnectionsController,
    );
    service = module.get<UserConnectionsService>(UserConnectionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new user connection', async () => {
      const createUserConnectionDto = factories.createUserConnectionDto.build();

      expect(await controller.create(userJwt, createUserConnectionDto)).toEqual(
        { isMutual: false, ...factories.oneUserConnection.build({}) },
      );

      expect(service.create).toHaveBeenCalledWith(1, {
        fromUserId: 1,
        toUserId: 2,
      });
    });
  });

  describe('findMyConnections()', () => {
    it('should find my mutual connections', async () => {
      expect(
        await controller.findMyConnections(userJwt, {
          connectionType: ConnectionType.Mutual,
          page: 1,
          numItemsPerPage: 10,
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionArray.build(),
      });

      expect(service.findMyUserConnections).toHaveBeenCalledWith({
        connectionType: ConnectionType.Mutual,
        paginationParams: { numItemsPerPage: 10, page: 1 },
        platformId: undefined,
        userId: 1,
      });
    });

    it('should find my follower connections', async () => {
      expect(
        await controller.findMyConnections(userJwt, {
          connectionType: ConnectionType.Follower,
          page: 1,
          numItemsPerPage: 10,
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionArray.build(),
      });

      expect(service.findMyUserConnections).toHaveBeenCalledWith({
        connectionType: ConnectionType.Follower,
        paginationParams: { numItemsPerPage: 10, page: 1 },
        platformId: undefined,
        userId: 1,
      });
    });

    it('should find my follow connections', async () => {
      expect(
        await controller.findMyConnections(userJwt, {
          connectionType: ConnectionType.Follow,
          page: 1,
          numItemsPerPage: 10,
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionArray.build(),
      });

      expect(service.findMyUserConnections).toHaveBeenCalledWith({
        connectionType: ConnectionType.Follow,
        paginationParams: { numItemsPerPage: 10, page: 1 },
        platformId: undefined,
        userId: 1,
      });
    });
  });

  describe('findOneByUserIds()', () => {
    it('should find a connection by user ids successfully', async () => {
      expect(
        await controller.findOneByUserIds({
          fromUserId: 1,
          toUserId: 2,
        }),
      ).toEqual(factories.oneUserConnection.build());

      expect(service.findOneByUserIds).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('findOne()', () => {
    it('should find a connection by id successfully', async () => {
      expect(await controller.findOne({ id: 1 })).toEqual(
        factories.oneUserConnection.build(),
      );

      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('remove()', () => {
    it('should remove a connection by id successfully', async () => {
      expect(await controller.remove(userJwt, { id: 1 })).toBeUndefined();

      expect(service.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('addNewPlatformToUserConnection()', () => {
    it('should add a new platform to existing user connection', async () => {
      const postPlatformConnectionDto =
        factories.postPlatformToUserConnectionDto.build();
      expect(
        await controller.addNewPlatformToUserConnection(
          userJwt,
          { id: 1 },
          postPlatformConnectionDto,
        ),
      ).toEqual(
        factories.oneUserConnection.build({
          platforms: [factories.onePlatform.build()],
        }),
      );

      expect(service.addNewPlatformToUserConnection).toHaveBeenCalledWith(
        1,
        1,
        1,
      );
    });
  });

  describe('removePlatformFromUserConnection()', () => {
    it('should delete a platform from existing user connection', async () => {
      expect(
        await controller.removePlatformFromUserConnection(userJwt, {
          platformId: 1,
          id: 1,
        }),
      ).toBeUndefined();

      expect(service.removePlatformFromUserConnection).toHaveBeenCalledWith(
        1,
        1,
        1,
      );
    });
  });
});
