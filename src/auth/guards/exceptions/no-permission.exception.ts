import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class NoPermissionException extends GenericException {
  constructor() {
    super(
      {
        message: 'You lack the permissions necessary to perform this action.',
        error: 'PERMISSION_DENIED',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
