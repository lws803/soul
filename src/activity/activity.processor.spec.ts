import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bull';
import axios from 'axios';

import * as factories from 'factories';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';

import { ActivityProcessor } from './activity.processor';
import { FollowActivityJobPayload } from './types';

describe(ActivityProcessor, () => {
  let processor: ActivityProcessor;
  const fromUser = factories.oneUser.build({
    id: 1,
    username: 'FROM_USER',
    userHandle: 'FROM_USER#1',
  });
  const toUser = factories.oneUser.build({
    id: 2,
    username: 'TO_USER',
    userHandle: 'TO_USER#2',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityProcessor,
        {
          provide: getRepositoryToken(PlatformUser),
          useValue: {
            findAndCount: jest
              .fn()
              .mockResolvedValue([
                [factories.onePlatformUser.build({ user: toUser })],
                1,
              ]),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    processor = module.get<ActivityProcessor>(ActivityProcessor);
    jest.spyOn(axios, 'post');
  });

  describe('processActivity()', () => {
    it('sends follow activity successfully', async () => {
      const postAction = jest.spyOn(axios, 'post');
      const response = await processor.processActivity({
        data: { fromUser, toUser, type: 'FOLLOW' },
      } as Job<FollowActivityJobPayload>);

      expect(response).toBeUndefined();

      expect(postAction).toHaveBeenCalledWith('ACTIVITY_WEBHOOK_URI', {
        fromUser: {
          id: fromUser.id,
          username: fromUser.username,
          userHandle: fromUser.userHandle,
        },
        toUser: {
          id: toUser.id,
          username: toUser.username,
          userHandle: toUser.userHandle,
        },
        type: 'FOLLOW',
      });
    });

    it('post webhook error does not terminate process', async () => {
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('API ERROR'));
      const response = await processor.processActivity({
        data: { fromUser, toUser, type: 'FOLLOW' },
      } as Job<FollowActivityJobPayload>);

      expect(response).toBeUndefined();
    });
  });
});
