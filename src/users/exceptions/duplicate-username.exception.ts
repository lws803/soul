import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicateUsernameException extends GenericException {
  constructor(username: string) {
    super(
      {
        message:
          `A user with the username: ${username} already exists. ` +
          'Please login or user a different username.',
        error: 'DUPLICATE_USERNAME_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
