import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class InvalidTokenException extends GenericException {
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
