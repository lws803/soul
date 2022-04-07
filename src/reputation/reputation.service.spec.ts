import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as factories from 'factories';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';
import { UsersService } from 'src/users/users.service';

import { ReputationService } from './reputation.service';

describe('ReputationService', () => {
  let service: ReputationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: getRepositoryToken(UserConnection),
          useValue: {
            count: jest.fn().mockResolvedValue(10),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
          },
        },
        {
          provide: getRepositoryToken(PlatformUser),
          useValue: {
            createQueryBuilder: jest.fn().mockImplementation(() => ({
              where: jest.fn().mockImplementation(() => ({
                getCount: jest.fn().mockResolvedValue(1),
              })),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneUserReputation()', () => {
    it('should fetch reputation from a specified user', async () => {
      const oneUser = factories.oneUser.build();

      expect(await service.findOneUserReputation(oneUser.id)).toEqual({
        reputation: 9,
        userId: oneUser.id,
      });
    });
  });
});
