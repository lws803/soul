import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicateUserConnectionException extends GenericException {
  constructor(fromUserId: number, toUserId: number) {
    super(
      {
        message: `A user connection from id: ${fromUserId} to id: ${toUserId} already exists`,
        error: 'DUPLICATE_USER_CONNECTION',
      },
      HttpStatus.CONFLICT,
    );
  }
}
