import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicateUserEmailException extends GenericException {
  constructor(email: string) {
    super(
      {
        message:
          `A user with the email address: ${email} already exists. ` +
          'Please login or use a different email address.',
        error: 'DUPLICATE_USER_EMAIL_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
