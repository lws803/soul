import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { User } from '@prisma/client';

import * as factories from 'factories';

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
      const user = factories.userEntity.build();
      const response = await processor.sendConfirmationEmail({
        data: {
          user,
          code: 'TEST_CODE',
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: {
          ...factories.userEntity.build(),
          url: 'BASE_URL?token=TEST_CODE',
        },
        subject: 'Verify your Soul account',
        template: 'confirmation',
        to: user.email,
      });
    });
  });

  describe('sendPasswordResetEmail()', () => {
    it('sends password reset email successfully', async () => {
      const user = factories.userEntity.build();
      const response = await processor.sendPasswordResetEmail({
        data: {
          user,
          code: 'TEST_CODE',
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: {
          ...factories.userEntity.build(),
          url: 'BASE_URL?token=TEST_CODE',
        },
        subject: 'Password reset',
        template: 'password-reset',
        to: user.email,
      });
    });
  });

  describe('sendPasswordResetConfirmationEmail()', () => {
    it('sends password reset confirmation email successfully', async () => {
      const user = factories.userEntity.build();
      const response = await processor.sendPasswordResetConfirmationEmail({
        data: {
          user,
        },
      } as Job<{ user: User; code: string }>);

      expect(response).toBeUndefined();

      expect(sendMail).toHaveBeenCalledWith({
        context: factories.userEntity.build(),
        subject: 'Password reset confirmation',
        template: 'password-reset-confirmation',
        to: user.email,
      });
    });
  });
});
