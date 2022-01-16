import { HttpException, HttpStatus } from '@nestjs/common';

export class UserConnectionToSelfException extends HttpException {
  constructor() {
    super(
      {
        message:
          'You cannot create a connection to yourself. Please try again.',
        error: 'USER_CONNECTION_TO_SELF',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
