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
import axios from 'axios';
import { classToPlain, plainToClass } from 'class-transformer';

import { PrismaService } from 'src/prisma/prisma.service';

import { ActivityJobPayload } from './types';
import { FollowActivityResponseEntity } from './serializers/api-responses.entity';

@Processor('activity_queue')
export class ActivityProcessor {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(
    // @InjectRepository(PlatformUser)
    // private platformUserRepository: Repository<PlatformUser>,
    private prismaService: PrismaService,
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
    const { fromUser, toUser, type: activityType } = job.data;
    this.logger.log(`Sending activity of type ${activityType}...'`);
    try {
      const platformUsers = await this.prismaService.platformUser.findMany({
        where: {
          userId: toUser.id,
          platform: {
            activityWebhookUri: {
              not: null,
            },
          },
        },
        include: { platform: true, user: true },
      });

      for (const platformUser of platformUsers) {
        const followActivityResponse = plainToClass(
          FollowActivityResponseEntity,
          { type: 'FOLLOW', fromUser, toUser },
        );

        try {
          await axios.post<void, void, any>(
            platformUser.platform.activityWebhookUri,
            classToPlain(followActivityResponse, {
              excludeExtraneousValues: true,
            }),
          );
        } catch (error) {
          this.logger.error(error);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send activity of type ${activityType}'`);
      throw error;
    }
  }
}
