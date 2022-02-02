import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as requestIp from 'request-ip';

import { GenericException } from '../exceptions/generic.exception';

const ALLOWED_WHITELIST = new Set(['127.0.0.1', '::1', '::ffff:172.17.0.1']);

@Injectable()
export class LocalIpWhitelistInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    if (
      !ALLOWED_WHITELIST.has(requestIp.getClientIp(httpContext.getRequest()))
    ) {
      throw new GenericException(
        {
          message: `Cannot get ${httpContext.getRequest().route.path}`,
          error: 'NOT_FOUND_ERROR',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return next.handle();
  }
}
