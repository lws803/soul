import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateUserExistException extends HttpException {
  constructor(email: string) {
    super(
      {
        message:
          `A user with the email address: ${email} already exists. ` +
          'Please login or use a different email address.',
        error: 'DUPLICATE_USER_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
