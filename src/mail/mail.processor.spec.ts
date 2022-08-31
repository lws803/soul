import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';

import * as factories from 'factories';
import { User } from 'src/users/entities/user.entity';

import { MailProcessor } from './mail.processor';

describe(MailProcessor, () => {
  let processor: MailProcessor;
  let sendMail: jest.Mock;

  beforeEach(async () => {
    sendMail = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailProcessor,
        {
          provide: MailerService,
          useValue: { sendMail },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('BASE_URL'),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    processor = module.get<MailProcessor>(MailProcessor);
  });

  describe('sendConfirmationEmail()', () => {
    it('sends welcome email successfully', async () => {
      const user = factories.user.build();
      const response = await processor.sendConfirmationEmail({
        data: {
          user,
          code: 'TEST_CODE',
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: {
          ...factories.user.build({ hashedPassword: undefined }),
          url: 'BASE_URL?token=TEST_CODE',
        },
        subject: 'Complete your soul profile',
        template: 'confirmation',
        to: user.email,
      });
    });
  });

  describe('sendPasswordResetEmail()', () => {
    it('sends password reset email successfully', async () => {
      const user = factories.user.build();
      const response = await processor.sendPasswordResetEmail({
        data: {
          user,
          code: 'TEST_CODE',
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: {
          ...factories.user.build({ hashedPassword: undefined }),
          url: 'BASE_URL?token=TEST_CODE',
        },
        subject: 'Reset password',
        template: 'password-reset',
        to: user.email,
      });
    });
  });
});
