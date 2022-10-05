import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UnauthorizedClientException extends GenericException {
  constructor() {
    super(
      {
        message:
          'Unauthorized client, wrong client secret used for the specified platform.',
        error: 'UNAUTHORIZED_CLIENT',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
