import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class InvalidTokenException extends GenericException {
  constructor() {
    super(
      {
        message: 'Your token is no longer valid, please request for a new one.',
        error: 'TOKEN_INVALID',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
