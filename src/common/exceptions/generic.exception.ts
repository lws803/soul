import { HttpException, HttpStatus } from '@nestjs/common';

export class GenericException extends HttpException {
  message: string;
  error: string;
  httpStatus: HttpStatus;
  constraints?: string[];

  constructor(
    args: { message: string; error: string; constraints?: string[] },
    httpStatus: HttpStatus,
  ) {
    super(
      {
        message: args.message,
        error: args.error,
        constraints: args.constraints,
      },
      httpStatus,
    );
    Object.assign(this, args);
    this.httpStatus = httpStatus;
  }
}
