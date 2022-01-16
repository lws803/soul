import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedUserException extends HttpException {
  constructor(msg?: string) {
    super(
      {
        message: msg || 'Unauthorized user.',
        error: 'UNAUTHORIZED_USER',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
