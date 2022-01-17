import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class UserConnectionNotFoundException extends GenericException {
  constructor({ id }: { id?: number }) {
    super(
      {
        message: id
          ? `User connection with id: ${id} not found`
          : 'User connection not found',
        error: 'USER_CONNECTION_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
