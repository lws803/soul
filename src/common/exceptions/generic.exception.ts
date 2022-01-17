import { HttpException, HttpStatus } from '@nestjs/common';

export class GenericException extends HttpException {
  message: string;
  error: string;
  httpStatus: HttpStatus;

  constructor(
    args: { message: string; error: string },
    httpStatus: HttpStatus,
  ) {
    super({ message: args.message, error: args.error }, httpStatus);
    Object.assign(this, args);
    this.httpStatus = httpStatus;
  }
}
