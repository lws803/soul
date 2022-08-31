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
    const usersList = factories.user.buildList(2);

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
              users: usersList,
              totalCount: usersList.length,
            }),
            findOne: jest.fn().mockResolvedValue(factories.user.build()),
            update: jest.fn().mockResolvedValue(
              factories.user.build({
                email: 'UPDATED_EMAIL@EMAIL.COM',
                username: 'UPDATED_USER',
                userHandle: 'UPDATED_USER#1',
              }),
            ),
            remove: jest.fn(),
            verifyConfirmationToken: jest
              .fn()
              .mockResolvedValue(factories.user.build()),
            resendConfirmationToken: jest.fn(),
            requestPasswordReset: jest.fn(),
            passwordReset: jest.fn().mockResolvedValue(factories.user.build()),
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
      const usersList = factories.user.buildList(2);
      expect(await controller.findAll(params)).toEqual({
        users: usersList,
        totalCount: usersList.length,
      });

      expect(usersService.findAll).toHaveBeenCalledWith(params);
    });

    it('should return all users with pagination', async () => {
      const usersList = factories.user.buildList(1);
      jest.spyOn(usersService, 'findAll').mockResolvedValue({
        users: usersList,
        totalCount: usersList.length,
      });
      const params = { page: 1, numItemsPerPage: 1 };
      expect(await controller.findAll(params)).toEqual({
        users: usersList,
        totalCount: usersList.length,
      });

      expect(usersService.findAll).toHaveBeenCalledWith(params);
    });
  });

  describe('findOne()', () => {
    it('should return a user', async () => {
      const user = factories.user.build();
      expect(await controller.findOne({ id: user.id })).toEqual(user);

      expect(usersService.findOne).toHaveBeenCalledWith(user.id);
    });

    it('should throw user not found', async () => {
      const oneUser = factories.user.build();
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
      const user = factories.user.build();
      const updateUserDto = factories.updateUserDto.build();
      const jwtPayload = factories.jwtPayload.build();

      expect(
        await controller.updateMe({ user: jwtPayload }, updateUserDto),
      ).toEqual(
        factories.user.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'UPDATED_USER',
          userHandle: 'UPDATED_USER#1',
        }),
      );

      expect(usersService.update).toHaveBeenCalledWith(user.id, updateUserDto);
    });

    it('should throw user not found', async () => {
      const user = factories.user.build();
      jest
        .spyOn(usersService, 'update')
        .mockRejectedValue(new UserNotFoundException({ id: user.id }));
      const jwtPayload = factories.jwtPayload.build();

      await expect(
        async () => await controller.updateMe({ user: jwtPayload }, {}),
      ).rejects.toThrow(new UserNotFoundException({ id: user.id }));
    });
  });

  describe('remove()', () => {
    it('should remove a user', async () => {
      const user = factories.user.build();
      const jwtPayload = factories.jwtPayload.build();

      await controller.removeMe({ user: jwtPayload });

      expect(usersService.remove).toHaveBeenCalledWith(user.id);
    });

    it('should throw user not found', async () => {
      const user = factories.user.build();
      jest
        .spyOn(usersService, 'remove')
        .mockRejectedValue(new UserNotFoundException({ id: user.id }));
      const jwtPayload = factories.jwtPayload.build();

      await expect(
        async () => await controller.removeMe({ user: jwtPayload }),
      ).rejects.toThrow(new UserNotFoundException({ id: user.id }));
    });
  });

  describe('findMe()', () => {
    it('gets the right user', async () => {
      const user = factories.user.build();
      const jwtPayload = factories.jwtPayload.build();
      expect(await controller.findMe({ user: jwtPayload })).toEqual(user);
    });
  });

  describe('verifyConfirmationToken()', () => {
    it('verifies token successfully', async () => {
      expect(
        await controller.verifyConfirmationToken({ token: 'TOKEN' }),
      ).toEqual(factories.user.build());

      expect(usersService.verifyConfirmationToken).toHaveBeenCalledWith(
        'TOKEN',
      );
    });
  });

  describe('resendConfirmationToken()', () => {
    it('resends confirmation email', async () => {
      expect(
        await controller.resendConfirmationToken({
          email: factories.user.build().email,
        }),
      ).toBeUndefined();

      expect(usersService.resendConfirmationToken).toHaveBeenCalledWith(
        factories.user.build().email,
      );
    });
  });

  describe('requestPasswordResetToken()', () => {
    it('requests password reset email successfully', async () => {
      expect(
        await controller.requestPasswordResetToken({
          email: factories.user.build().email,
        }),
      ).toBeUndefined();

      expect(usersService.requestPasswordReset).toHaveBeenCalledWith(
        factories.user.build().email,
      );
    });
  });

  describe('passwordReset()', () => {
    it('resets password for user', async () => {
      expect(
        await controller.passwordReset(
          { token: 'TOKEN' },
          { password: 'NEW_PASSWORD' },
        ),
      ).toEqual(factories.user.build());

      expect(usersService.passwordReset).toHaveBeenCalledWith(
        'TOKEN',
        'NEW_PASSWORD',
      );
    });
  });
});
