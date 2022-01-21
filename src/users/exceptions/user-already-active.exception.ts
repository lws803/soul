import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UserAlreadyActiveException extends GenericException {
  constructor() {
    super(
      {
        message: 'Your account has already been activated, please login.',
        error: 'USER_ALREADY_ACTIVE',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
