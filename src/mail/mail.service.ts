import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as Sentry from '@sentry/node';

import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue('mail_queue')
    private mailQueue: Queue,
  ) {}

  async sendConfirmationEmail(user: User, code: string) {
    try {
      await this.mailQueue.add('confirmation', {
        user,
        code,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error queueing confirmation email to user ${user.email}`,
      );
      Sentry.captureException(error);
      return false;
    }
  }

  async sendPasswordResetEmail(user: User, code: string) {
    try {
      await this.mailQueue.add('password_reset', {
        user,
        code,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error queueing password reset email to user ${user.email}`,
      );
      Sentry.captureException(error);
      return false;
    }
  }

  async sendPasswordResetConfirmationEmail(user: User) {
    try {
      await this.mailQueue.add('password_reset_confirmation', {
        user,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error queueing password reset confirmation email to user ${user.email}`,
      );
      Sentry.captureException(error);
      return false;
    }
  }
}
