import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidTokenException extends HttpException {
  constructor(msg?: string) {
    super(
      {
        message: msg || 'Invalid token used.',
        error: 'INVALID_TOKEN',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
