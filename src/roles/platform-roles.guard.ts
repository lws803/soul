import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { plainToClass } from 'class-transformer';

import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { PlatformsService } from 'src/platforms/platforms.service';

import { NoPermissionException } from './exceptions/no-permission.exception';
import { UserRole } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly platformsService: PlatformsService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }

    const { user, params } = context.switchToHttp().getRequest();
    const { platform_id }: { platform_id: string } = params;
    const userJwt = plainToClass(JWTPayload, user);

    if (
      userJwt.platformId === this.configService.get('SOUL_DEFAULT_PLATFORM_ID')
    ) {
      // If user logged in from platform 2 (soul landing page) we want to check if the user is
      // an admin of the platform he's trying to access.
      const platformUser = await this.platformsService.findOnePlatformUser(
        Number(platform_id),
        userJwt.userId,
      );

      const canAccess = requiredRoles.some((role) =>
        platformUser.roles.includes(role),
      );
      if (!canAccess) {
        throw new NoPermissionException();
      }
      return true;
    }

    // Ensures that the user has the required role within the platform
    const canAccess =
      requiredRoles.some((role) => userJwt.roles?.includes(role)) &&
      userJwt.platformId === Number(platform_id);
    if (!canAccess) {
      throw new NoPermissionException();
    }

    return canAccess;
  }
}
