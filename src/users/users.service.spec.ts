import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';

import * as factories from 'factories';
import { MailService } from 'src/mail/mail.service';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { DuplicateUserEmailException } from './exceptions/duplicate-user-email.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { DuplicateUsernameException } from './exceptions';
import { CreateUserDto, UpdateUserDto } from './serializers/api.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mailService: MailService;
  let repository: Repository<User>;
  let refreshTokensRepository: Repository<RefreshToken>;

  let userCreateQueryBuilder: any;

  beforeEach(async () => {
    const usersList = factories.user.buildList(2);
    userCreateQueryBuilder = {
      select: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      where: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      orderBy: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      skip: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      take: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([usersList, usersList.length]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue(usersList),
            findOne: jest.fn().mockResolvedValue(factories.user.build()),
            save: jest.fn().mockResolvedValue(factories.user.build()),
            update: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => userCreateQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: { delete: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((arg) => {
              const keys = {
                MAIL_TOKEN_SECRET: 'MAIL_TOKEN_SECRET',
                MAIL_TOKEN_EXPIRATION_TIME: 3600,
              };
              return keys[arg];
            }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendConfirmationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokensRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
  });

  describe('create()', () => {
    it('should successfully insert a user', async () => {
      const oneUser = factories.user.build();
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(oneUser);

      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );
      expect(await service.create(createUserDto)).toStrictEqual(oneUser);

      expect(repository.save).toHaveBeenCalledWith({
        email: 'TEST_USER@EMAIL.COM',
        username: 'test-user',
        hashedPassword: expect.any(String),
        isActive: false,
        bio: null,
        displayName: null,
      });
      // Update step to update the userHandle
      expect(repository.update).toHaveBeenCalledWith(
        { id: oneUser.id },
        {
          userHandle: 'test-user#1',
        },
      );
    });

    it('should throw duplicate user email error', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(factories.user.build());
      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        new DuplicateUserEmailException(createUserDto.email),
      );
    });

    it('should throw duplicate username error', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(factories.user.build());
      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        new DuplicateUsernameException(createUserDto.username),
      );
    });
  });

  describe('findAll()', () => {
    it('should successfully return a list of users with total count', async () => {
      const users = factories.user.buildList(2);
      const totalCount = users.length;
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10 }),
      ).toStrictEqual({ users, totalCount });
    });

    it('should paginate correctly', async () => {
      const users = factories.user.buildList(1);
      jest
        .spyOn(userCreateQueryBuilder, 'getManyAndCount')
        .mockResolvedValueOnce([users, users.length]);

      expect(
        await service.findAll({ page: 1, numItemsPerPage: 1 }),
      ).toStrictEqual({
        users,
        totalCount: users.length,
      });

      expect(userCreateQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(userCreateQueryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should query for users with the given full text query', async () => {
      const users = factories.user.buildList(2);
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10, q: 'test-user' }),
      ).toStrictEqual({
        users,
        totalCount: users.length,
      });

      expect(userCreateQueryBuilder.where).toHaveBeenCalledWith(
        'user.username like :query',
        { query: 'test-user%' },
      );
    });
  });

  describe('findOne()', () => {
    it('should return a user successfully', async () => {
      const user = factories.user.build();
      expect(await service.findOne(user.id)).toStrictEqual(user);

      expect(repository.findOne).toHaveBeenCalledWith({ id: user.id });
    });

    it('throws user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

      await expect(service.findOne(1)).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });
  });

  describe('update()', () => {
    it('updates a user successfully', async () => {
      const user = factories.user.build();
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...user,
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'updated-user',
          userHandle: 'updated-user#1',
          bio: 'UPDATED_BIO',
          displayName: 'UPDATED_DISPLAY_NAME',
        });

      const updatedUserDto = plainToClass(
        UpdateUserDto,
        factories.updateUserRequest.build(),
      );

      expect(await service.update(user.id, updatedUserDto)).toStrictEqual(
        factories.user.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'updated-user',
          userHandle: 'updated-user#1',
          bio: 'UPDATED_BIO',
          displayName: 'UPDATED_DISPLAY_NAME',
        }),
      );

      expect(repository.update).toHaveBeenCalledWith(
        { id: user.id },
        {
          ...updatedUserDto,
          userHandle: 'updated-user#1',
        },
      );
    });

    it('throws user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

      await expect(service.update(1, {})).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });

    it("updates a user's bio and display name successfully", async () => {
      const user = factories.user.build();
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...user,
          bio: null,
          displayName: 'DISPLAY_NAME',
        });

      const updatedUserDto = {
        bio: null,
      };

      expect(await service.update(user.id, updatedUserDto)).toStrictEqual({
        ...user,
        ...updatedUserDto,
      });

      expect(repository.update).toHaveBeenCalledWith(
        { id: user.id },
        {
          email: 'TEST_USER_1@EMAIL.COM',
          username: 'test-user-1',
          displayName: user.displayName,
          ...updatedUserDto,
        },
      );
    });
  });

  describe('remove()', () => {
    it('deletes a user successfully', async () => {
      const user = factories.user.build();
      await service.remove(user.id);

      expect(repository.delete).toHaveBeenCalledWith({ id: user.id });
    });

    it('throws user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

      await expect(service.remove(1)).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });
  });

  describe('verifyConfirmationToken()', () => {
    beforeEach(() => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => ({
        id: factories.user.build().id,
        tokenType: 'confirmation',
      }));
    });

    it('verifies and sets user as active', async () => {
      expect(await service.verifyConfirmationToken('TOKEN')).toEqual(
        factories.user.build(),
      );

      expect(repository.save).toHaveBeenCalledWith(
        factories.user.build({ isActive: true }),
      );
    });
  });

  describe('resendConfirmationToken()', () => {
    beforeEach(() => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockResolvedValue(factories.user.build({ isActive: false }));

      jest.spyOn(jsonwebtoken, 'sign').mockImplementation(() => 'TOKEN');
    });

    it('sends another email to user with confirmation token', async () => {
      expect(
        await service.resendConfirmationToken(factories.user.build().email),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).toHaveBeenCalledWith(
        factories.user.build({ isActive: false }),
        'TOKEN',
      );
    });

    it('does not surface UserNotFoundException when user is not found', async () => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockRejectedValue(
          new UserNotFoundException({ email: 'test@email.com' }),
        );

      expect(
        await service.resendConfirmationToken(factories.user.build().email),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('does not send confirmation email when user is active', async () => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockResolvedValue(factories.user.build({ isActive: true }));

      expect(
        await service.resendConfirmationToken(factories.user.build().email),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('surfaces other errors that are not related to user not found', async () => {
      const error = new Error('UNKNOWN_ERROR');
      jest.spyOn(service, 'findOneByEmail').mockRejectedValue(error);

      expect(
        service.resendConfirmationToken(factories.user.build().email),
      ).rejects.toThrow(error);

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset()', () => {
    beforeEach(() => {
      jest.spyOn(jsonwebtoken, 'sign').mockImplementation(() => 'TOKEN');
    });

    it('sends password reset email to user', async () => {
      expect(
        await service.requestPasswordReset(factories.user.build().email),
      ).toBeUndefined();

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        factories.user.build(),
        'TOKEN',
      );
    });

    it('does not surface UserNotFoundException when user is not found', async () => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockRejectedValue(
          new UserNotFoundException({ email: 'test@email.com' }),
        );

      expect(
        await service.requestPasswordReset(factories.user.build().email),
      ).toBeUndefined();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('surfaces other errors that are not related to user not found', async () => {
      const error = new Error('UNKNOWN_ERROR');
      jest.spyOn(service, 'findOneByEmail').mockRejectedValue(error);

      expect(
        service.requestPasswordReset(factories.user.build().email),
      ).rejects.toThrow(error);
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('passwordReset()', () => {
    beforeEach(() => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => ({
        id: factories.user.build().id,
        tokenType: 'passwordReset',
      }));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => 'NEW_HASHED_PASSWORD');
    });

    it('resets password from user', async () => {
      const savedUser = factories.user.build({
        hashedPassword: 'NEW_HASHED_PASSWORD',
      });

      expect(await service.passwordReset('TOKEN', 'NEW_PASSWORD')).toEqual(
        savedUser,
      );
      expect(repository.save).toHaveBeenCalledWith(savedUser);
      expect(refreshTokensRepository.delete).toHaveBeenCalledWith({
        user: savedUser,
      });
    });
  });
});
