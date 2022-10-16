import { Test, TestingModule } from '@nestjs/testing';
import * as Sentry from '@sentry/node';

import * as factories from 'factories';

import { MailService } from './mail.service';

describe(MailService, () => {
  let service: MailService;
  let addToQueue: jest.Mock;

  beforeEach(async () => {
    addToQueue = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: 'BullQueue_mail_queue',
          useValue: {
            add: addToQueue,
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<MailService>(MailService);
    jest.spyOn(Sentry, 'captureException');
  });

  describe('sendConfirmationEmail()', () => {
    it('sends confirmation email', async () => {
      const result = await service.sendConfirmationEmail(
        factories.userEntity.build(),
        'TEST_CODE',
      );
      expect(result).toBe(true);

      expect(addToQueue).toHaveBeenCalledWith('confirmation', {
        code: 'TEST_CODE',
        user: factories.userEntity.build(),
      });
    });

    it('fails to send confirmation email', async () => {
      const mockedSentryCaptureException = jest.spyOn(
        Sentry,
        'captureException',
      );
      addToQueue.mockRejectedValueOnce(new Error('TEST_ERROR'));
      const result = await service.sendConfirmationEmail(
        factories.userEntity.build(),
        'TEST_CODE',
      );
      expect(result).toBe(false);
      expect(mockedSentryCaptureException).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail()', () => {
    it('sends password reset email', async () => {
      const result = await service.sendPasswordResetEmail(
        factories.userEntity.build(),
        'TEST_CODE',
      );
      expect(result).toBe(true);

      expect(addToQueue).toHaveBeenCalledWith('password_reset', {
        code: 'TEST_CODE',
        user: factories.userEntity.build(),
      });
    });

    it('fails to send password reset email', async () => {
      const mockedSentryCaptureException = jest.spyOn(
        Sentry,
        'captureException',
      );
      addToQueue.mockRejectedValueOnce(new Error('TEST_ERROR'));
      const result = await service.sendConfirmationEmail(
        factories.userEntity.build(),
        'TEST_CODE',
      );
      expect(result).toBe(false);
      expect(mockedSentryCaptureException).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetConfirmationEmail()', () => {
    it('sends password reset confirmation email', async () => {
      const result = await service.sendPasswordResetConfirmationEmail(
        factories.userEntity.build(),
      );
      expect(result).toBe(true);

      expect(addToQueue).toHaveBeenCalledWith('password_reset_confirmation', {
        user: factories.userEntity.build(),
      });
    });

    it('fails to send password reset confirmation email', async () => {
      const mockedSentryCaptureException = jest.spyOn(
        Sentry,
        'captureException',
      );
      addToQueue.mockRejectedValueOnce(new Error('TEST_ERROR'));
      const result = await service.sendPasswordResetConfirmationEmail(
        factories.userEntity.build(),
      );
      expect(result).toBe(false);
      expect(mockedSentryCaptureException).toHaveBeenCalled();
    });
  });
});
