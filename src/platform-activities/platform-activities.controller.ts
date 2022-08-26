import { Controller } from '@nestjs/common';

import { PlatformActivitiesService } from './platform-activities.service';

@Controller('platform-activities')
export class PlatformActivitiesController {
  constructor(
    private readonly platformActivitiesService: PlatformActivitiesService,
  ) {}

  // TODO: Create endpoints for requesting a subscription, accepting a subscription, removing a subscription
}
