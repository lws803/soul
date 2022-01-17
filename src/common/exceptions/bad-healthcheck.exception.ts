import { HttpStatus } from '@nestjs/common';

import { GenericException } from './generic.exception';

export class BadHealthcheckException extends GenericException {
  constructor() {
    super(
      {
        message:
          'Service is in an unhealthy state. Please contact the service owner.',
        error: 'BAD_HEALTHCHECK',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
