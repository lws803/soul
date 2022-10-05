import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class NullClientSecretException extends GenericException {
  constructor() {
    super(
      {
        message:
          'Client secret not set, please use the /generate-new-client-secret endpoint to ' +
          'generate a new client secret before using this endpoint.',
        error: 'UNAUTHORIZED_CLIENT',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
