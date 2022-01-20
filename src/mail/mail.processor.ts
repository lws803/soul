import { MailerService } from '@nestjs-modules/mailer';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { plainToClass } from 'class-transformer';

import { User } from 'src/users/entities/user.entity';

@Processor('mail_queue')
export class MailProcessor {
  constructor(
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    // this.logger.debug(
    //   `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(
    //     job.data,
    //   )}`,
    // );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    // this.logger.debug(
    //   `Completed job ${job.id} of type ${job.name}. Result: ${JSON.stringify(
    //     result,
    //   )}`,
    // );
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    // this.logger.error(
    //   `Failed job ${job.id} of type ${job.name}: ${error.message}`,
    //   error.stack,
    // );
  }

  @Process('confirmation')
  async sendWelcomeEmail(job: Job<{ user: User; code: string }>): Promise<any> {
    // this.logger.log(`Sending confirmation email to '${job.data.user.email}'`);

    // if (this.configService.get<boolean>('mail.live')) {
    //   return 'SENT MOCK CONFIRMATION EMAIL';
    // }

    try {
      const result = await this.mailerService.sendMail({
        template: 'confirmation',
        context: {
          ...plainToClass(User, job.data.user),
          url: 'TEST_URL',
        },
        subject: 'Hello World',
        to: job.data.user.email,
      });
      return result;
    } catch (error) {
      // this.logger.error(
      //   `Failed to send confirmation email to '${job.data.user.email}'`,
      //   error.stack,
      // );
      throw error;
    }
  }
}
