import { Module, HttpException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
// eslint-disable-next-line import/no-named-as-default
import Redis from 'ioredis';

import config from '../config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { AuthModule } from './auth/auth.module';
import { PlatformsModule } from './platforms/platforms.module';
import { UserConnectionsModule } from './user-connections/user-connections.module';
import { AllExceptionFilter } from './filters/all-exception.filter';
import { MailModule } from './mail/mail.module';
import { ReputationModule } from './reputation/reputation.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: { level: 'trace', redact: ['req.headers["authorization"]'] },
    }),
    ConfigModule.forRoot(config),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLER_TTL'),
        limit: configService.get('THROTTLER_LIMIT'),
        storage: new ThrottlerStorageRedisService(
          new Redis(
            configService.get('REDIS_DB_PORT'),
            configService.get('REDIS_DB_HOST'),
            {
              db: configService.get('REDIS_DB_INDEX'),
              password: configService.get('REDIS_DB_PASSWORD'),
              keyPrefix: configService.get('REDIS_DB_THROTTLER_KEY_PREFIX'),
            },
          ),
        ),
      }),
    }),
    UsersModule,
    AuthModule,
    PlatformsModule,
    UserConnectionsModule,
    MailModule,
    RavenModule,
    ReputationModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        filters: [
          {
            type: HttpException,
            filter: (exception: HttpException) => 500 > exception.getStatus(),
          },
        ],
      }),
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
