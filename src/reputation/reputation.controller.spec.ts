import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

describe('ReputationController', () => {
  let controller: ReputationController;
  const user = factories.user.build();

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReputationController],
      providers: [
        {
          provide: ReputationService,
          useValue: {
            findOneUserReputation: jest.fn().mockResolvedValue({
              userId: user.id,
              reputation: 2,
            }),
          },
        },
      ],
    }).compile();

    controller = app.get<ReputationController>(ReputationController);
  });

  describe('findOneUserReputation', () => {
    it('should return reputation', async () => {
      expect(
        await controller.findOneUserReputation({ userId: user.id }),
      ).toEqual({
        userId: user.id,
        reputation: 2,
      });
    });
  });
});
