import { HttpException, HttpStatus } from '@nestjs/common';

export class UserConnectionNotFoundException extends HttpException {
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
