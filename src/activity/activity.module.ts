import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

import { ActivityService } from './activity.service';
import { ActivityProcessor } from './activity.processor';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'activity_queue',
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
  ],
  controllers: [],
  providers: [ActivityService, ActivityProcessor, PrismaService],
  exports: [ActivityService],
})
export class ActivityModule {}
