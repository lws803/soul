import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class InvalidCodeException extends GenericException {
  constructor() {
    super(
      {
        message: 'Invalid code used.',
        error: 'INVALID_CODE',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
