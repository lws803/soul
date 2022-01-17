import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UserNotInvolvedInConnectionException extends GenericException {
  constructor() {
    super(
      {
        message: 'You have no permissions to update this connection.',
        error: 'USER_NOT_INVOLVED_IN_CONNECTION',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
