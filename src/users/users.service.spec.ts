import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { JsonWebTokenError } from 'jsonwebtoken';

import * as factories from 'factories';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { UsersService } from './users.service';
import { DuplicateUserEmailException } from './exceptions/duplicate-user-email.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import {
  DuplicateUsernameException,
  InvalidTokenException,
} from './exceptions';
import { CreateUserDto, UpdateUserDto } from './serializers/api.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mailService: MailService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest
                .fn()
                .mockResolvedValue(factories.userEntity.build()),
              create: jest.fn().mockResolvedValue(factories.userEntity.build()),
              update: jest.fn().mockResolvedValue(factories.userEntity.build()),
              findMany: jest
                .fn()
                .mockResolvedValue(factories.userEntity.buildList(2)),
              count: jest.fn().mockResolvedValue(2),
              delete: jest.fn(),
              findFirst: jest.fn().mockResolvedValue(null),
            },
            refreshToken: {
              deleteMany: jest.fn(),
            },
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
            sendPasswordResetConfirmationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create()', () => {
    it('should successfully insert a user', async () => {
      const oneUser = factories.userEntity.build();
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(oneUser);

      const createUserDto = plainToClass(
        CreateUserDto,
        factories.createUserRequest.build(),
      );
      expect(await service.create(createUserDto)).toStrictEqual(oneUser);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'TEST_USER@EMAIL.COM',
          username: 'test-user',
          hashedPassword: expect.any(String),
          isActive: false,
          bio: null,
          displayName: null,
        },
      });
      // Update step to update the userHandle
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: oneUser.id,
        },
        data: {
          userHandle: 'test-user-1#1',
        },
      });
    });

    it('should throw duplicate user email error', async () => {
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(factories.userEntity.build());
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
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValueOnce(null)
        .mockResolvedValue(factories.userEntity.build());

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
      const users = factories.userEntity.buildList(2);
      const totalCount = users.length;
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10 }),
      ).toStrictEqual({ users, totalCount });
    });

    it('should paginate correctly', async () => {
      const users = factories.userEntity.buildList(1);
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(users);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(users.length);

      expect(
        await service.findAll({ page: 1, numItemsPerPage: 1 }),
      ).toStrictEqual({
        users,
        totalCount: users.length,
      });

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 1,
        where: {},
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should query for users with the given full text query', async () => {
      const users = factories.userEntity.buildList(2);
      expect(
        await service.findAll({ page: 1, numItemsPerPage: 10, q: 'test-user' }),
      ).toStrictEqual({
        users,
        totalCount: users.length,
      });

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 10,
        where: { username: { startsWith: 'test-user' } },
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { username: { startsWith: 'test-user' } },
      });
    });
  });

  describe('findOne()', () => {
    it('should return a user successfully', async () => {
      const user = factories.userEntity.build();
      expect(await service.findOne(user.id)).toStrictEqual(user);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
      });
    });

    it('throws user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(undefined);

      await expect(service.findOne(1)).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });
  });

  describe('update()', () => {
    it('updates a user successfully', async () => {
      const user = factories.userEntity.build();
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
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
        factories.userEntity.build({
          email: 'UPDATED_EMAIL@EMAIL.COM',
          username: 'updated-user',
          userHandle: 'updated-user#1',
          bio: 'UPDATED_BIO',
          displayName: 'UPDATED_DISPLAY_NAME',
        }),
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          ...updatedUserDto,
          userHandle: 'updated-user#1',
        },
      });
    });

    it('throws user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(undefined);

      await expect(service.update(1, {})).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });

    it("updates a user's bio and display name successfully", async () => {
      const user = factories.userEntity.build();
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(user);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
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

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: updatedUserDto,
      });
    });
  });

  describe('remove()', () => {
    it('deletes a user successfully', async () => {
      const user = factories.userEntity.build();
      await service.remove(user.id);

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: user.id },
      });
    });

    it('throws user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(undefined);

      await expect(service.remove(1)).rejects.toThrow(
        new UserNotFoundException({ id: 1 }),
      );
    });
  });

  describe('verifyConfirmationToken()', () => {
    const user = factories.userEntity.build();

    beforeEach(() => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => ({
        id: user.id,
        tokenType: 'confirmation',
      }));
    });

    it('verifies and sets user as active', async () => {
      expect(await service.verifyConfirmationToken('TOKEN')).toEqual(user);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        data: { isActive: true },
        where: {
          id: user.id,
        },
      });
    });

    it('throws token expired error', async () => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => {
        throw new JsonWebTokenError('MESSAGE', new Error('ERROR'));
      });

      expect(service.verifyConfirmationToken('TOKEN')).rejects.toThrow(
        new InvalidTokenException(),
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resendConfirmationToken()', () => {
    beforeEach(() => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockResolvedValue(factories.userEntity.build({ isActive: false }));

      jest.spyOn(jsonwebtoken, 'sign').mockImplementation(() => 'TOKEN');
    });

    it('sends another email to user with confirmation token', async () => {
      expect(
        await service.resendConfirmationToken(
          factories.userEntity.build().email,
        ),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).toHaveBeenCalledWith(
        factories.userEntity.build({ isActive: false }),
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
        await service.resendConfirmationToken(
          factories.userEntity.build().email,
        ),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('does not send confirmation email when user is active', async () => {
      jest
        .spyOn(service, 'findOneByEmail')
        .mockResolvedValue(factories.userEntity.build({ isActive: true }));

      expect(
        await service.resendConfirmationToken(
          factories.userEntity.build().email,
        ),
      ).toBeUndefined();

      expect(mailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('surfaces other errors that are not related to user not found', async () => {
      const error = new Error('UNKNOWN_ERROR');
      jest.spyOn(service, 'findOneByEmail').mockRejectedValue(error);

      expect(
        service.resendConfirmationToken(factories.userEntity.build().email),
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
        await service.requestPasswordReset(factories.userEntity.build().email),
      ).toBeUndefined();

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        factories.userEntity.build(),
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
        await service.requestPasswordReset(factories.userEntity.build().email),
      ).toBeUndefined();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('surfaces other errors that are not related to user not found', async () => {
      const error = new Error('UNKNOWN_ERROR');
      jest.spyOn(service, 'findOneByEmail').mockRejectedValue(error);

      expect(
        service.requestPasswordReset(factories.userEntity.build().email),
      ).rejects.toThrow(error);
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('passwordReset()', () => {
    beforeEach(() => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => ({
        id: factories.userEntity.build().id,
        tokenType: 'passwordReset',
      }));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => 'NEW_HASHED_PASSWORD');
    });

    it('resets password from user', async () => {
      const savedUser = factories.userEntity.build({
        hashedPassword: 'NEW_HASHED_PASSWORD',
      });
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(savedUser);

      expect(await service.passwordReset('TOKEN', 'NEW_PASSWORD')).toEqual(
        savedUser,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: savedUser.id },
        data: { hashedPassword: savedUser.hashedPassword },
      });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: savedUser.id },
      });
      expect(
        mailService.sendPasswordResetConfirmationEmail,
      ).toHaveBeenCalledWith(savedUser);
    });

    it('throws token expired error', async () => {
      jest.spyOn(jsonwebtoken, 'verify').mockImplementation(() => {
        throw new JsonWebTokenError('MESSAGE', new Error('ERROR'));
      });

      expect(service.passwordReset('TOKEN', 'NEW_PASSWORD')).rejects.toThrow(
        new InvalidTokenException(),
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(prismaService.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });
});
