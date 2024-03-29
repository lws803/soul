import { MailerService } from '@nestjs-modules/mailer';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as Sentry from '@sentry/node';
import { User } from '@prisma/client';

@Processor('mail_queue')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private configService: ConfigService,
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

  @Process('confirmation')
  async sendConfirmationEmail(job: Job<{ user: User; code: string }>) {
    this.logger.log(`Sending confirmation email to '${job.data.user.email}'`);
    try {
      await this.mailerService.sendMail({
        template: 'confirmation',
        context: {
          ...job.data.user,
          url: `${this.configService.get('MAIL_CONFIRMATION_BASE_URL')}?token=${
            job.data.code
          }`,
        },
        subject: 'Verify your Soul account',
        to: job.data.user.email,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email to '${job.data.user.email}'`,
      );
      throw error;
    }
  }

  @Process('password_reset')
  async sendPasswordResetEmail(job: Job<{ user: User; code: string }>) {
    this.logger.log(`Sending password reset email to '${job.data.user.email}'`);
    try {
      await this.mailerService.sendMail({
        template: 'password-reset',
        context: {
          ...job.data.user,
          url: `${this.configService.get(
            'MAIL_PASSWORD_RESET_BASE_URL',
          )}?token=${job.data.code}`,
        },
        subject: 'Password reset',
        to: job.data.user.email,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to '${job.data.user.email}'`,
      );
      throw error;
    }
  }

  @Process('password_reset_confirmation')
  async sendPasswordResetConfirmationEmail(job: Job<{ user: User }>) {
    this.logger.log(
      `Sending password reset confirmation email to '${job.data.user.email}'`,
    );
    try {
      await this.mailerService.sendMail({
        template: 'password-reset-confirmation',
        context: job.data.user,
        subject: 'Password reset confirmation',
        to: job.data.user.email,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation email to '${job.data.user.email}'`,
      );
      throw error;
    }
  }
}
