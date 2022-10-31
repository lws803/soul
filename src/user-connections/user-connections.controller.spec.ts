import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';

import * as factories from 'factories';
import { CreateUserConnectionDto } from 'src/user-connections/serializers/api.dto';

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
              ...factories.userConnectionEntity.build(),
              isMutual: false,
            }),
            findAll: jest.fn().mockResolvedValue({
              totalCount: factories.userConnectionEntityArray.build().length,
              userConnections: factories.userConnectionEntityArray.build(),
            }),
            findMyUserConnections: jest.fn().mockResolvedValue({
              totalCount: factories.userConnectionEntityArray.build().length,
              userConnections: factories.userConnectionEntityArray.build(),
            }),
            findOneByUserIds: jest
              .fn()
              .mockResolvedValue(factories.userConnectionEntity.build()),
            findOne: jest
              .fn()
              .mockResolvedValue(factories.userConnectionEntity.build()),
            remove: jest.fn(),
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
      const createUserConnectionDto = plainToClass(
        CreateUserConnectionDto,
        factories.createUserConnectionRequest.build(),
      );

      expect(await controller.create(userJwt, createUserConnectionDto)).toEqual(
        { isMutual: false, ...factories.userConnectionEntity.build({}) },
      );

      expect(service.create).toHaveBeenCalledWith(1, createUserConnectionDto);
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
        userConnections: factories.userConnectionEntityArray.build(),
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
        userConnections: factories.userConnectionEntityArray.build(),
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
          connectionType: ConnectionType.Following,
          page: 1,
          numItemsPerPage: 10,
        }),
      ).toEqual({
        totalCount: 2,
        userConnections: factories.userConnectionEntityArray.build(),
      });

      expect(service.findMyUserConnections).toHaveBeenCalledWith({
        connectionType: ConnectionType.Following,
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
      ).toEqual(factories.userConnectionEntity.build());

      expect(service.findOneByUserIds).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('findOne()', () => {
    it('should find a connection by id successfully', async () => {
      expect(await controller.findOne({ id: 1 })).toEqual(
        factories.userConnectionEntity.build(),
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
});
