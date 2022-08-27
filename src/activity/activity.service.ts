import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as Sentry from '@sentry/node';

import { FollowActivityPayload } from './types';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectQueue('activity_queue')
    private activityQueue: Queue,
  ) {}

  async sendFollowActivity({
    fromUser,
    toUser,
  }: Omit<FollowActivityPayload, 'type'>) {
    const payload: FollowActivityPayload = {
      type: 'FOLLOW',
      fromUser,
      toUser,
    };

    try {
      await this.activityQueue.add('activity', payload);
      return true;
    } catch (error) {
      this.logger.error(
        `Error queueing follow activity from user ${fromUser.id} to user ${toUser.id}`,
      );
      Sentry.captureException(error);
      return false;
    }
  }
}
