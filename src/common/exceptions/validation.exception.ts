import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(message: any) {
    super(
      {
        message,
        error: 'VALIDATION_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
