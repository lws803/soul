import { HttpException, HttpStatus } from '@nestjs/common';

export class NoAdminsRemainingException extends HttpException {
  constructor() {
    super(
      {
        message:
          'It seems like you might be the last admin of this platform. You need to appoint another admin before performing this action.',
        error: 'NO_ADMINS_REMAINING',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
