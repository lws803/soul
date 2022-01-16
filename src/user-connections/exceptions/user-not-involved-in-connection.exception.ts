import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotInvolvedInConnectionException extends HttpException {
  constructor() {
    super(
      {
        message: 'You have no permissions to update this connection.',
        error: 'USER_NOT_INVOLVED_IN_CONNECTION',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
