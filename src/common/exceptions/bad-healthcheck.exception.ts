import { HttpException, HttpStatus } from '@nestjs/common';

export class BadHealthcheckException extends HttpException {
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
