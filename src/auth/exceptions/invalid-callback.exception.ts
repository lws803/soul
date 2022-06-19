import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class InvalidCallbackException extends GenericException {
  constructor() {
    super(
      {
        message: 'Invalid redirect uri supplied',
        error: 'INVALID_REDIRECT_URI',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
