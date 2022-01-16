import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UnauthorizedUserException } from '../exceptions/unauthorized-user.exception';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw new UnauthorizedUserException();
    }
    return user;
  }
}
