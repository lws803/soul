import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateUserConnectionException extends HttpException {
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
