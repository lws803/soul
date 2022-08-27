import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { ActivityService } from './activity.service';

describe(ActivityService, () => {
  let service: ActivityService;
  let addToQueue: jest.Mock;

  beforeEach(async () => {
    addToQueue = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: 'BullQueue_activity_queue',
          useValue: {
            add: addToQueue,
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<ActivityService>(ActivityService);
  });

  describe('sendFollowActivity()', () => {
    it('sends follow activity', async () => {
      const fromUser = factories.oneUser.build();
      const toUser = factories.oneUser.build({
        id: 2,
        username: 'TO_USER',
        userHandle: 'TO_USER#2',
      });
      const result = await service.sendFollowActivity({ fromUser, toUser });
      expect(result).toBe(true);

      expect(addToQueue).toHaveBeenCalledWith('activity', {
        type: 'FOLLOW',
        fromUser,
        toUser,
      });
    });

    it('fails to send follow activity', async () => {
      addToQueue.mockRejectedValueOnce(new Error('TEST_ERROR'));
      const result = await service.sendFollowActivity({
        fromUser: factories.oneUser.build(),
        toUser: factories.oneUser.build({
          id: 2,
          username: 'TO_USER',
          userHandle: 'TO_USER#2',
        }),
      });
      expect(result).toBe(false);
    });
  });
});
