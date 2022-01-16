import { HttpException, HttpStatus } from '@nestjs/common';

export class NoPermissionException extends HttpException {
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
