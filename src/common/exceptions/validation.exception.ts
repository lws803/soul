import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';

import { GenericException } from './generic.exception';

export class ValidationException extends GenericException {
  constraints: string[];

  constructor(message: ValidationError[]) {
    super(
      {
        message: 'Validation error.',
        error: 'VALIDATION_ERROR',
        constraints: message.flatMap((error) =>
          Object.values(error.constraints),
        ),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
