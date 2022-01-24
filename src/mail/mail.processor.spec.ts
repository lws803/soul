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
          useValue: {},
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
          id: 1,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          email: 'TEST_USER@EMAIL.COM',
          isActive: true,
          url: 'http://localhost:3000/v1/users/verify_confirmation_token?token=TEST_CODE',
          userHandle: 'TEST_USER#1',
          username: 'TEST_USER',
        },
        subject: 'Hello World',
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
          id: 1,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          email: 'TEST_USER@EMAIL.COM',
          isActive: true,
          url: 'http://localhost:3000/v1/users/password_reset?token=TEST_CODE',
          userHandle: 'TEST_USER#1',
          username: 'TEST_USER',
        },
        subject: 'Password Reset',
        template: 'password-reset',
        to: 'TEST_USER@EMAIL.COM',
      });
    });
  });
});
