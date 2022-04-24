import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
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

  beforeEach(async () => {
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
            createQueryBuilder: jest.fn().mockImplementation(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getManyAndCount: jest
                .fn()
                .mockResolvedValue([
                  factories.userArray.build(),
                  factories.userArray.build().length,
                ]),
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((arg) => {
              const keys = {
                MAIL_TOKEN_SECRET: 'MAIL_TOKEN_SECRET',
                MAIL_TOKEN_EXPIRATION_TIME: '3600',
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

  it('should be defined', () => {
    expect(service).toBeDefined();
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
          userHandle: 'TEST_USER#1',
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
      jest.spyOn(repository, 'createQueryBuilder').mockImplementation(
        () =>
          ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getManyAndCount: jest
              .fn()
              .mockResolvedValue([
                [factories.userArray.build()[0]],
                factories.userArray.build().length,
              ]),
          } as unknown as SelectQueryBuilder<User>),
      );

      expect(
        await service.findAll({ page: 1, numItemsPerPage: 1 }),
      ).toStrictEqual({
        users: [factories.userArray.build()[0]],
        totalCount: factories.userArray.build().length,
      });

      // TODO: Maybe add test for the query builder here
    });

    it('should query for users with the given full text query', async () => {
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10, q: 'TEST_USER' }),
      ).toStrictEqual({
        users: factories.userArray.build(),
        totalCount: factories.userArray.build().length,
      });

      // TODO: Maybe add test for the query builder here
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
          userHandle: 'UPDATED_USER#1',
        }),
      );

      expect(await service.update(user.id, updatedUserDto)).toStrictEqual(
        factories.oneUser.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'UPDATED_USER',
          userHandle: 'UPDATED_USER#1',
        }),
      );

      expect(repository.update).toHaveBeenCalledWith(
        { id: user.id },
        {
          ...updatedUserDto,
          userHandle: 'UPDATED_USER#1',
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
