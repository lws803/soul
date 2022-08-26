import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlatformsModule } from 'src/platforms/platforms.module';

import { PlatformActivitiesService } from './platform-activities.service';
import { PlatformActivitiesController } from './platform-activities.controller';
import { PlatformActivitySubscription } from './entities/platform-activity-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformActivitySubscription]),
    PlatformsModule,
  ],
  controllers: [PlatformActivitiesController],
  providers: [PlatformActivitiesService],
})
export class PlatformActivitiesModule {}
