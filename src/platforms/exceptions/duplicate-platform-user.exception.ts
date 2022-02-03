import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicatePlatformUserException extends GenericException {
  constructor() {
    super(
      {
        message: `The user is already in this platform.`,
        error: 'DUPLICATE_PLATFORM_USER_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
