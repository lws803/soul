import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as Sentry from '@sentry/node';
import { Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';

import { PlatformUser } from 'src/platforms/entities/platform-user.entity';

import { ActivityJobPayload, FollowActivityWebhookPayload } from './types';

@Processor('activity_queue')
export class ActivityProcessor {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(
        job.data,
      )}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.debug(`Completed job ${job.id} of type ${job.name}.`);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
    Sentry.captureException(error);
  }

  @Process('activity')
  async processActivity(job: Job<ActivityJobPayload>) {
    // TODO: Add tests
    this.logger.log(`Sending activity of type ${job.data.type}...'`);

    const { fromUser, toUser } = job.data;
    try {
      const [platformUsers] = await this.platformUserRepository.findAndCount({
        where: {
          user: job.data.toUser,
          platform: { activityWebhookUri: Not(IsNull()) },
        },
        relations: ['user', 'platform'],
      });

      for (const platformUser of platformUsers) {
        try {
          await axios.post<void, void, FollowActivityWebhookPayload>(
            platformUser.platform.activityWebhookUri,
            {
              type: 'FOLLOW',
              fromUser: {
                id: fromUser.id,
                userHandle: fromUser.userHandle,
                username: fromUser.username,
              },
              toUser: {
                id: toUser.id,
                userHandle: toUser.userHandle,
                username: toUser.username,
              },
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send activity of type ${job.data.type}'`);
      throw error;
    }
  }
}
