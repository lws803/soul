import { HttpStatus } from '@nestjs/common';

import { GenericException } from './generic.exception';

export class ValidationException extends GenericException {
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
