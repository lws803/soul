import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { PlatformsService } from 'src/platforms/platforms.service';

import { GetPlatformActivitySubscriptionDto } from './dtos/api-responses.dto';
import { SubscribeRequestBodyDto } from './dtos/api.dto';
import { PlatformActivitySubscription } from './entities/platform-activity-subscription.entity';
import { DuplicatePlatformActivitySubscriptionException } from './exceptions/duplicate-platform-activity-subscription.exception';

@Injectable()
export class PlatformActivitiesService {
  constructor(
    @InjectRepository(PlatformActivitySubscription)
    private platformActivitySubscriptionRepository: Repository<PlatformActivitySubscription>,
    private platformService: PlatformsService,
  ) {}

  async createSubscriptionRequest({
    fromPlatformId,
    platformId,
  }: SubscribeRequestBodyDto & {
    fromPlatformId: number;
  }): Promise<GetPlatformActivitySubscriptionDto> {
    const fromPlatform = await this.platformService.findOne(fromPlatformId);
    const toPlatform = await this.platformService.findOne(platformId);

    const newSubscription = new PlatformActivitySubscription();
    newSubscription.fromPlatform = fromPlatform;
    newSubscription.toPlatform = toPlatform;
    newSubscription.isActive = false;

    try {
      const savedSubscription =
        await this.platformActivitySubscriptionRepository.save(newSubscription);
      return savedSubscription;
    } catch (exception) {
      if (
        exception instanceof QueryFailedError &&
        exception.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new DuplicatePlatformActivitySubscriptionException(
          fromPlatformId,
          platformId,
        );
      }
      throw exception;
    }
  }
}
