import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

import * as factories from 'factories';
import { MailService } from 'src/mail/mail.service';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { DuplicateUserExistException } from './exceptions/duplicate-user-exists.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

describe('UsersService', () => {
  let service: UsersService;
  let mailService: MailService;
  let repository: Repository<User>;

  let userCreateQueryBuilder: any;

  beforeEach(async () => {
    userCreateQueryBuilder = {
      select: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      where: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      orderBy: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      skip: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      take: jest.fn().mockImplementation(() => userCreateQueryBuilder),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([
          factories.userArray.build(),
          factories.userArray.build().length,
        ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue(factories.userArray.build()),
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
            save: jest.fn().mockResolvedValue(factories.oneUser.build()),
            update: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => userCreateQueryBuilder),
          },
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
  });

  describe('create()', () => {
    it('should successfully insert a user', async () => {
      const oneUser = factories.oneUser.build();
      const createUserDto = factories.createUserDto.build();
      expect(await service.create(createUserDto)).toStrictEqual(oneUser);

      expect(repository.save).toHaveBeenCalledWith({
        email: 'TEST_USER@EMAIL.COM',
        username: 'TEST_USER',
        hashedPassword: expect.any(String),
        isActive: false,
      });
      // Update step to update the userHandle
      expect(repository.update).toHaveBeenCalledWith(
        { id: oneUser.id },
        {
          userHandle: 'test_user#1',
        },
      );
    });

    it('should throw duplicate user error', async () => {
      const createUserDto = factories.createUserDto.build();
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(
          new QueryFailedError('', [], { code: 'ER_DUP_ENTRY' }),
        );

      await expect(service.create(createUserDto)).rejects.toThrow(
        new DuplicateUserExistException(createUserDto.email),
      );
    });
  });

  describe('findAll()', () => {
    it('should successfully return a list of users with total count', async () => {
      const users = factories.userArray.build();
      const totalCount = users.length;
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10 }),
      ).toStrictEqual({ users, totalCount });
    });

    it('should paginate correctly', async () => {
      jest
        .spyOn(userCreateQueryBuilder, 'getManyAndCount')
        .mockResolvedValueOnce([
          [factories.userArray.build()[0]],
          factories.userArray.build().length,
        ]);

      expect(
        await service.findAll({ page: 1, numItemsPerPage: 1 }),
      ).toStrictEqual({
        users: [factories.userArray.build()[0]],
        totalCount: factories.userArray.build().length,
      });

      expect(userCreateQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(userCreateQueryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should query for users with the given full text query', async () => {
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10, q: 'TEST_USER' }),
      ).toStrictEqual({
        users: factories.userArray.build(),
        totalCount: factories.userArray.build().length,
      });

      expect(userCreateQueryBuilder.where).toHaveBeenCalledWith(
        'user.username like :query',
        { query: 'TEST_USER%' },
      );
    });
  });

  describe('findOne()', () => {
    it('should return a user successfully', async () => {
      const user = factories.oneUser.build();
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
      const updatedUserDto = factories.updateUserDto.build();
      const user = factories.oneUser.build();
      jest.spyOn(repository, 'findOne').mockResolvedValue(
        factories.oneUser.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'UPDATED_USER',
          userHandle: 'updated_user#1',
        }),
      );

      expect(await service.update(user.id, updatedUserDto)).toStrictEqual(
        factories.oneUser.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'UPDATED_USER',
          userHandle: 'updated_user#1',
        }),
      );

      expect(repository.update).toHaveBeenCalledWith(
        { id: user.id },
        {
          ...updatedUserDto,
          userHandle: 'updated_user#1',
        },
      );
    });

    it('throws user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

      await expect(service.update(1, {})).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });
  });

  describe('remove()', () => {
    it('deletes a user successfully', async () => {
      const user = factories.oneUser.build();
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
        id: factories.oneUser.build().id,
        tokenType: 'confirmation',
      }));
    });

    it('verifies and sets user as active', async () => {
      expect(await service.verifyConfirmationToken('TOKEN')).toEqual(
        factories.oneUser.build(),
      );

      expect(repository.save).toHaveBeenCalledWith(
        factories.oneUser.build({ isActive: true }),
      );
    });
  });

  describe('resendConfirmationToken()', () => {
    beforeEach(() => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockResolvedValue(factories.oneUser.build({ isActive: false }));

      jest.spyOn(jsonwebtoken, 'sign').mockImplementation(() => 'TOKEN');
    });

    it('sends another email to user with confirmation token', async () => {
      expect(
        await service.resendConfirmationToken(factories.oneUser.build().email),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).toHaveBeenCalledWith(
        factories.oneUser.build({ isActive: false }),
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
        await service.resendConfirmationToken(factories.oneUser.build().email),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('does not send confirmation email when user is active', async () => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockResolvedValue(factories.oneUser.build({ isActive: true }));

      expect(
        await service.resendConfirmationToken(factories.oneUser.build().email),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('surfaces other errors that are not related to user not found', async () => {
      const error = new Error('UNKNOWN_ERROR');
      jest.spyOn(service, 'findOneByEmail').mockRejectedValue(error);

      expect(
        service.resendConfirmationToken(factories.oneUser.build().email),
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
        await service.requestPasswordReset(factories.oneUser.build().email),
      ).toBeUndefined();

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        factories.oneUser.build(),
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
        await service.requestPasswordReset(factories.oneUser.build().email),
      ).toBeUndefined();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('surfaces other errors that are not related to user not found', async () => {
      const error = new Error('UNKNOWN_ERROR');
      jest.spyOn(service, 'findOneByEmail').mockRejectedValue(error);

      expect(
        service.requestPasswordReset(factories.oneUser.build().email),
      ).rejects.toThrow(error);
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('passwordReset()', () => {
    beforeEach(() => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => ({
        id: factories.oneUser.build().id,
        tokenType: 'passwordReset',
      }));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => 'NEW_HASHED_PASSWORD');
    });

    it('sends password reset email to user', async () => {
      const savedUser = factories.oneUser.build({
        hashedPassword: 'NEW_HASHED_PASSWORD',
      });

      expect(await service.passwordReset('TOKEN', 'NEW_PASSWORD')).toEqual(
        savedUser,
      );
      expect(repository.save).toHaveBeenCalledWith(savedUser);
    });
  });
});
