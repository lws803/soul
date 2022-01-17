import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class NoAdminsRemainingException extends GenericException {
  constructor() {
    super(
      {
        message:
          'It seems like you might be the last admin of this platform. You need to appoint another admin before performing this action.',
        error: 'NO_ADMINS_REMAINING',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
