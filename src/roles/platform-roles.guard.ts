import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';

import { NoPermissionException } from './exceptions/no-permission.exception';
import { UserRole } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user, params } = context.switchToHttp().getRequest();
    const { platformId } = params;
    const userJwt = new JWTPayload(user);

    // Ensures that the user has the required role within the platform
    const canAccess =
      requiredRoles.some((role) => userJwt.roles?.includes(role)) &&
      userJwt.platformId === parseInt(platformId, 10);
    if (!canAccess) {
      throw new NoPermissionException();
    }

    return canAccess;
  }
}
