import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';

import * as factories from 'factories';

import { CreateUserDto, UpdateUserDto } from './serializers/api.dto';
import { DuplicateUserEmailException } from './exceptions/duplicate-user-email.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DuplicateUsernameException } from './exceptions';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const usersList = factories.userEntity.buildList(2);

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
            findOne: jest.fn().mockResolvedValue(factories.userEntity.build()),
            update: jest.fn().mockResolvedValue(
              factories.userEntity.build({
                email: 'UPDATED_EMAIL@EMAIL.COM',
                username: 'updated-user',
                userHandle: 'updated-user#1',
              }),
            ),
            remove: jest.fn(),
            verifyConfirmationToken: jest
              .fn()
              .mockResolvedValue(factories.userEntity.build()),
            resendConfirmationToken: jest.fn(),
            requestPasswordReset: jest.fn(),
            passwordReset: jest
              .fn()
              .mockResolvedValue(factories.userEntity.build()),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
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
      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );

      const resp = await controller.create(createUserDto);

      expect(resp).toEqual({
        id: '1',
        ...createUserDto,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining(createUserDto),
      );
    });

    it('should return duplicate user email error', async () => {
      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(
          new DuplicateUserEmailException(createUserDto.email),
        );

      await expect(
        async () => await controller.create(createUserDto),
      ).rejects.toThrow(new DuplicateUserEmailException(createUserDto.email));
    });

    it('should return duplicate username error', async () => {
      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(
          new DuplicateUsernameException(createUserDto.username),
        );

      await expect(
        async () => await controller.create(createUserDto),
      ).rejects.toThrow(new DuplicateUsernameException(createUserDto.username));
    });
  });

  describe('findAll()', () => {
    it('should return all users', async () => {
      const params = { page: 1, numItemsPerPage: 10 };
      const usersList = factories.userEntity.buildList(2);
      expect(await controller.findAll(params)).toEqual({
        users: usersList,
        totalCount: usersList.length,
      });

      expect(usersService.findAll).toHaveBeenCalledWith(params);
    });

    it('should return all users with pagination', async () => {
      const usersList = factories.userEntity.buildList(1);
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
      const user = factories.userEntity.build();
      expect(await controller.findOne({ id: user.id })).toEqual(user);

      expect(usersService.findOne).toHaveBeenCalledWith(user.id);
    });

    it('should throw user not found', async () => {
      const oneUser = factories.userEntity.build();
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
      const user = factories.userEntity.build();
      const updateUserDto = plainToClass(
        UpdateUserDto,
        factories.updateUserRequest.build(),
      );
      const jwtPayload = factories.jwtPayload.build();

      expect(
        await controller.updateMe({ user: jwtPayload }, updateUserDto),
      ).toEqual(
        factories.userEntity.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'updated-user',
          userHandle: 'updated-user#1',
        }),
      );

      expect(usersService.update).toHaveBeenCalledWith(user.id, updateUserDto);
    });

    it('should throw user not found', async () => {
      const user = factories.userEntity.build();
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
      const user = factories.userEntity.build();
      const jwtPayload = factories.jwtPayload.build();

      await controller.removeMe({ user: jwtPayload });

      expect(usersService.remove).toHaveBeenCalledWith(user.id);
    });

    it('should throw user not found', async () => {
      const user = factories.userEntity.build();
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
      const user = factories.userEntity.build();
      const jwtPayload = factories.jwtPayload.build();
      expect(await controller.findMe({ user: jwtPayload })).toEqual(user);
    });
  });

  describe('verifyConfirmationToken()', () => {
    it('verifies token successfully', async () => {
      expect(
        await controller.verifyConfirmationToken({ token: 'TOKEN' }),
      ).toEqual(factories.userEntity.build());

      expect(usersService.verifyConfirmationToken).toHaveBeenCalledWith(
        'TOKEN',
      );
    });
  });

  describe('resendConfirmationToken()', () => {
    it('resends confirmation email', async () => {
      expect(
        await controller.resendConfirmationToken({
          email: factories.userEntity.build().email,
        }),
      ).toBeUndefined();

      expect(usersService.resendConfirmationToken).toHaveBeenCalledWith(
        factories.userEntity.build().email,
      );
    });
  });

  describe('requestPasswordResetToken()', () => {
    it('requests password reset email successfully', async () => {
      expect(
        await controller.requestPasswordResetToken({
          email: factories.userEntity.build().email,
        }),
      ).toBeUndefined();

      expect(usersService.requestPasswordReset).toHaveBeenCalledWith(
        factories.userEntity.build().email,
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
      ).toEqual(factories.userEntity.build());

      expect(usersService.passwordReset).toHaveBeenCalledWith(
        'TOKEN',
        'NEW_PASSWORD',
      );
    });
  });
});
