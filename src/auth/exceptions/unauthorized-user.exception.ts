import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UnauthorizedUserException extends GenericException {
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
