import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import axios from 'axios';

import * as factories from 'factories';
import { PrismaService } from 'src/prisma/prisma.service';

import { ActivityProcessor } from './activity.processor';
import { FollowActivityJobPayload } from './types';

describe(ActivityProcessor, () => {
  let processor: ActivityProcessor;
  const fromUser = factories.userEntity.build({
    id: 1,
    username: 'FROM_USER',
    userHandle: 'FROM_USER#1',
  });
  const toUser = factories.userEntity.build({
    id: 2,
    username: 'TO_USER',
    userHandle: 'TO_USER#2',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityProcessor,
        {
          provide: PrismaService,
          useValue: {
            platformUser: {
              findMany: jest.fn().mockResolvedValue([
                {
                  ...factories.platformUserEntity.build({
                    userId: toUser.id,
                  }),
                  platform: factories.platformEntity.build(),
                  user: factories.userEntity.build(),
                },
              ]),
            },
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
        from_user: {
          id: fromUser.id,
          username: fromUser.username,
          user_handle: fromUser.userHandle,
          bio: fromUser.bio,
          display_name: fromUser.displayName,
        },
        to_user: {
          id: toUser.id,
          username: toUser.username,
          user_handle: toUser.userHandle,
          bio: toUser.bio,
          display_name: toUser.displayName,
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
