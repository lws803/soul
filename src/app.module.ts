import { Module, HttpException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { ScheduleModule } from '@nestjs/schedule';

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
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

@Module({
  imports: [
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
    { provide: APP_INTERCEPTOR, useValue: new RequestLoggingInterceptor() },
  ],
})
export class AppModule {}
