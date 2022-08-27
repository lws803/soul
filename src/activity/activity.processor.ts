import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as Sentry from '@sentry/node';

import { PlatformsService } from 'src/platforms/platforms.service';

import { ActivityPayload } from './types';

@Processor('activity_queue')
export class ActivityProcessor {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(
    private configService: ConfigService,
    private platformService: PlatformsService,
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
  async processActivity(job: Job<ActivityPayload>) {
    // TODO: Implement
    // this.logger.log(`Sending confirmation email to '${job.data.user.email}'`);
    try {
      // await this.activityService.sendMail({
      //   template: 'confirmation',
      //   context: {
      //     ...plainToClass(User, job.data.user),
      //     url: `${this.configService.get('MAIL_CONFIRMATION_BASE_URL')}?token=${
      //       job.data.code
      //     }`,
      //   },
      //   subject: 'Complete your soul profile',
      //   to: job.data.user.email,
      // });
    } catch (error) {
      // this.logger.error(
      //   `Failed to send confirmation email to '${job.data.user.email}'`,
      // );
      throw error;
    }
  }
}
