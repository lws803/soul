import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UserConnectionToSelfException extends GenericException {
  constructor() {
    super(
      {
        message:
          'You cannot create a connection to yourself. Please try again.',
        error: 'USER_CONNECTION_TO_SELF',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
