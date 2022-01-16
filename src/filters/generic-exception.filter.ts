import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class GenericExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      let errorType = 'UNKNOWN_ERROR';
      if (exception.getStatus() === HttpStatus.UNAUTHORIZED) {
        errorType = 'UNAUTHORIZED_ERROR';
      }
      response.status(exception.getStatus()).json({
        message: exception.message,
        error: exception.getResponse()['error'] || errorType,
      });
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: exception.message,
        error: 'UNKNOWN_ERROR',
      });
    }
  }
}
