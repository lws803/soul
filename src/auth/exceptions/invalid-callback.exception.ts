import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class InvalidCallbackException extends GenericException {
  constructor() {
    super(
      {
        message: 'Invalid callback uri supplied',
        error: 'INVALID_CALLBACK_URI',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
