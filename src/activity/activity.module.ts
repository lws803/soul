import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlatformsModule } from 'src/platforms/platforms.module';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';

import { ActivityService } from './activity.service';
import { ActivityProcessor } from './activity.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformUser]),
    BullModule.registerQueueAsync({
      name: 'mail_queue',
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_DB_HOST'),
          port: configService.get('REDIS_DB_PORT'),
          db: configService.get('REDIS_DB_INDEX'),
          password: configService.get('REDIS_DB_PASSWORD'),
          keyPrefix: configService.get('REDIS_DB_BG_QUEUE_KEY_PREFIX'),
        },
        defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 1000 },
      }),
      inject: [ConfigService],
    }),
    PlatformsModule,
  ],
  controllers: [],
  providers: [ActivityService, ActivityProcessor],
  exports: [ActivityService],
})
export class ActivityModule {}
