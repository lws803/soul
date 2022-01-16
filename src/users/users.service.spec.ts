import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import * as factories from 'factories';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { DuplicateUserExistException } from './exceptions/duplicate-user-exists.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

describe('UsersService', () => {
  let service: UsersService;
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
            findAndCount: jest
              .fn()
              .mockResolvedValue([
                factories.userArray.build(),
                factories.userArray.build().length,
              ]),
            save: jest.fn().mockResolvedValue(factories.oneUser.build()),
            update: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
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

      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: {
          id: 'ASC',
        },
        skip: 0,
        take: 10,
      });
    });

    it('should paginate correctly', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([
          [factories.userArray.build()[0]],
          factories.userArray.build().length,
        ]);

      expect(
        await service.findAll({ page: 1, numItemsPerPage: 1 }),
      ).toStrictEqual({
        users: [factories.userArray.build()[0]],
        totalCount: factories.userArray.build().length,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: {
          id: 'ASC',
        },
        skip: 0,
        take: 1,
      });
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
          hashedPassword: expect.any(String),
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
});
