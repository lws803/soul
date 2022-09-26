import { Module, HttpException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { AuthModule } from './auth/auth.module';
import { PlatformsModule } from './platforms/platforms.module';
import { Platform } from './platforms/entities/platform.entity';
import { PlatformUser } from './platforms/entities/platform-user.entity';
import { UserConnectionsModule } from './user-connections/user-connections.module';
import { UserConnection } from './user-connections/entities/user-connection.entity';
import { AllExceptionFilter } from './filters/all-exception.filter';
import { MailModule } from './mail/mail.module';
import { ReputationModule } from './reputation/reputation.module';
import { PlatformCategory } from './platforms/entities/platform-category.entity';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: { level: 'trace' },
    }),
    ConfigModule.forRoot(config),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        ssl: configService.get('DB_SSL')
          ? { rejectUnauthorized: false }
          : undefined,
        entities: [
          User,
          RefreshToken,
          Platform,
          PlatformUser,
          UserConnection,
          PlatformCategory,
        ],
      }),
      inject: [ConfigService],
    }),
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
