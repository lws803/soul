import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: configService.get('MAIL_SECURE'),
          // tls: { ciphers: 'SSLv3', }, // gmail
          auth:
            configService.get('MAIL_USERNAME') &&
            configService.get('MAIL_PASSWORD')
              ? {
                  user: configService.get('MAIL_USERNAME'),
                  pass: configService.get('MAIL_PASSWORD'),
                }
              : undefined,
        },
        defaults: {
          from: configService.get('MAIL_FROM'),
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'mail_queue',
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_DB_HOST'),
          port: configService.get('REDIS_DB_PORT'),
          db: configService.get('REDIS_DB_INDEX'),
          password: configService.get('REDIS_DB_PASSWORD'),
        },
        defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 1000 },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
