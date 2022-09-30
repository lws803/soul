import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';

import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';

import { NoPermissionException } from '../exceptions';

/**
 * Disables platform user access to a specific resource when used as a guard
 */
@Injectable()
export class DisableForPlatformUsersGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const userJwt = plainToClass(JWTPayload, user);

    if (
      userJwt.platformId &&
      userJwt.platformId !== this.configService.get('SOUL_DEFAULT_PLATFORM_ID')
    ) {
      throw new NoPermissionException();
    }
    return true;
  }
}
