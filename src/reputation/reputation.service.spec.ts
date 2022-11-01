import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

import { ReputationService } from './reputation.service';

describe('ReputationService', () => {
  let service: ReputationService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.userEntity.build()),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            platformUser: {
              count: jest.fn().mockResolvedValue(1),
            },
            userConnection: {
              count: jest.fn().mockResolvedValue(10),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneUserReputation()', () => {
    it('should fetch reputation from a specified user', async () => {
      const oneUser = factories.userEntity.build();

      expect(await service.findOneUserReputation(oneUser.id)).toEqual({
        reputation: 9,
        user: oneUser,
      });
      expect(prismaService.userConnection.count).toHaveBeenCalledWith({
        where: { toUserId: oneUser.id },
      });
      expect(prismaService.platformUser.count).toHaveBeenCalledWith({
        where: { roles: { array_contains: 'banned' }, userId: oneUser.id },
      });
    });
  });
});
