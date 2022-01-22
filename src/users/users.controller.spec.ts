import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { CreateUserDto } from './dto/api.dto';
import { DuplicateUserExistException } from './exceptions/duplicate-user-exists.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest
              .fn()
              .mockImplementation((user: CreateUserDto) =>
                Promise.resolve({ id: '1', ...user }),
              ),
            findAll: jest.fn().mockResolvedValue({
              users: factories.userArray.build(),
              totalCount: factories.userArray.build().length,
            }),
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
            update: jest.fn().mockResolvedValue(
              factories.oneUser.build({
                email: 'UPDATED_EMAIL@EMAIL.COM',
                username: 'UPDATED_USER',
                userHandle: 'UPDATED_USER#1',
              }),
            ),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a user', async () => {
      const createUserDto = factories.createUserDto.build();

      const resp = await controller.create(createUserDto);

      expect(resp).toEqual({
        id: '1',
        ...createUserDto,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining(createUserDto),
      );
    });

    it('should return duplicate error', async () => {
      const createUserDto = factories.createUserDto.build();
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(
          new DuplicateUserExistException(createUserDto.email),
        );

      await expect(
        async () => await controller.create(createUserDto),
      ).rejects.toThrow(new DuplicateUserExistException(createUserDto.email));
    });
  });

  describe('findAll()', () => {
    it('should return all users', async () => {
      const params = { page: 1, numItemsPerPage: 10 };
      expect(await controller.findAll(params)).toEqual({
        users: factories.userArray.build(),
        totalCount: factories.userArray.build().length,
      });

      expect(usersService.findAll).toHaveBeenCalledWith(params);
    });

    it('should return all users with pagination', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValue({
        users: [factories.userArray.build()[0]],
        totalCount: factories.userArray.build().length,
      });
      const params = { page: 1, numItemsPerPage: 1 };
      expect(await controller.findAll(params)).toEqual({
        users: [factories.userArray.build()[0]],
        totalCount: factories.userArray.build().length,
      });

      expect(usersService.findAll).toHaveBeenCalledWith(params);
    });
  });

  describe('findOne()', () => {
    it('should return a user', async () => {
      const user = factories.oneUser.build();
      expect(await controller.findOne({ id: user.id })).toEqual(user);

      expect(usersService.findOne).toHaveBeenCalledWith(user.id);
    });

    it('should throw user not found', async () => {
      const oneUser = factories.oneUser.build();
      jest
        .spyOn(usersService, 'findOne')
        .mockRejectedValue(new UserNotFoundException({ id: oneUser.id }));

      await expect(
        async () => await controller.findOne({ id: oneUser.id }),
      ).rejects.toThrow(new UserNotFoundException({ id: oneUser.id }));
    });
  });

  describe('update()', () => {
    it('should update a user', async () => {
      const user = factories.oneUser.build();
      const updateUserDto = factories.updateUserDto.build();

      expect(await controller.updateMe({ id: user.id }, updateUserDto)).toEqual(
        factories.oneUser.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'UPDATED_USER',
          userHandle: 'UPDATED_USER#1',
        }),
      );

      expect(usersService.update).toHaveBeenCalledWith(user.id, updateUserDto);
    });

    it('should throw user not found', async () => {
      const user = factories.oneUser.build();
      jest
        .spyOn(usersService, 'update')
        .mockRejectedValue(new UserNotFoundException({ id: user.id }));

      await expect(
        async () => await controller.updateMe({ id: user.id }, {}),
      ).rejects.toThrow(new UserNotFoundException({ id: user.id }));
    });
  });

  describe('remove()', () => {
    it('should remove a user', async () => {
      const user = factories.oneUser.build();

      await controller.removeMe({ id: user.id });

      expect(usersService.remove).toHaveBeenCalledWith(user.id);
    });

    it('should throw user not found', async () => {
      const user = factories.oneUser.build();
      jest
        .spyOn(usersService, 'remove')
        .mockRejectedValue(new UserNotFoundException({ id: user.id }));

      await expect(
        async () => await controller.removeMe({ id: user.id }),
      ).rejects.toThrow(new UserNotFoundException({ id: user.id }));
    });
  });

  describe('getMe()', () => {
    it('gets the right user', async () => {
      const user = factories.oneUser.build();
      const jwtPayload = factories.jwtPayload.build();
      expect(await controller.getMe({ user: jwtPayload })).toEqual(user);
    });
  });
});
