import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { GenericException } from 'src/common/exceptions/generic.exception';

@Catch(Error)
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      let errorType = 'INTERNAL_SERVER_ERROR';
      if (exception.getStatus() === HttpStatus.UNAUTHORIZED) {
        errorType = 'UNAUTHORIZED_ERROR';
      }
      if (exception.getStatus() === HttpStatus.NOT_FOUND) {
        errorType = 'NOT_FOUND_ERROR';
      }
      if (exception instanceof GenericException) {
        errorType = exception.error;
      }

      response.status(exception.getStatus()).json({
        message: exception.message,
        error: errorType,
      });
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: exception.message,
        error: 'UNKNOWN_ERROR',
      });
    }
  }
}