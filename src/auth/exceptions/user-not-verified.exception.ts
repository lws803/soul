import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UserNotVerifiedException extends GenericException {
  constructor() {
    super(
      {
        message: 'User is not verified, please verify your email address.',
        error: 'USER_NOT_VERIFIED',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
