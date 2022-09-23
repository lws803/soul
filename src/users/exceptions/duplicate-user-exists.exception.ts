import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicateUserExistException extends GenericException {
  constructor({ email, username }: { email?: string; username?: string }) {
    super(
      {
        message: email
          ? `A user with the email address: ${email} already exists. ` +
            'Please login or use a different email address.'
          : `A user with the username: ${username} already exists. ` +
            'Please login or user a different username.',
        error: 'DUPLICATE_USER_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
