import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

describe('ReputationController', () => {
  let controller: ReputationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReputationController],
      providers: [
        {
          provide: ReputationService,
          useValue: {
            findOneUserReputation: jest.fn().mockResolvedValue({
              userId: factories.oneUser.build().id,
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
      const oneUser = factories.oneUser.build();
      expect(
        await controller.findOneUserReputation({ userId: oneUser.id }),
      ).toEqual({
        userId: oneUser.id,
        reputation: 2,
      });
    });
  });
});
