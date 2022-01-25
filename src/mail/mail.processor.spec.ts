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

  describe('sendWelcomeEmail()', () => {
    it('sends welcome email successfully', async () => {
      const response = await processor.sendWelcomeEmail({
        data: {
          user: factories.oneUser.build(),
          code: 'TEST_CODE',
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: {
          ...factories.oneUser.build({ hashedPassword: undefined }),
          url: 'BASE_URL?token=TEST_CODE',
        },
        subject: 'Complete your soul profile',
        template: 'confirmation',
        to: 'TEST_USER@EMAIL.COM',
      });
    });
  });

  describe('sendPasswordResetEmail()', () => {
    it('sends password reset email successfully', async () => {
      const response = await processor.sendPasswordResetEmail({
        data: {
          user: factories.oneUser.build(),
          code: 'TEST_CODE',
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: {
          ...factories.oneUser.build({ hashedPassword: undefined }),
          url: 'BASE_URL?token=TEST_CODE',
        },
        subject: 'Reset password',
        template: 'password-reset',
        to: 'TEST_USER@EMAIL.COM',
      });
    });
  });
});
