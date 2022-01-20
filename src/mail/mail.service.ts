import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail_queue')
    private mailQueue: Queue,
  ) {}

  async sendConfirmationEmail(user: User, code: string): Promise<boolean> {
    try {
      await this.mailQueue.add('confirmation', {
        user,
        code,
      });
      return true;
    } catch (error) {
      // this.logger.error(`Error queueing confirmation email to user ${user.email}`)
      return false;
    }
  }
}
