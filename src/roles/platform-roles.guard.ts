import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';

import { NoPermissionException } from './exceptions/no-permission.exception';
import { UserRole } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

const SOUL_PLATFORM_ID = 2;

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
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
    const userJwt = new JWTPayload(user);

    if (userJwt.platformId === SOUL_PLATFORM_ID) {
      // If user logged in from platform 2 (soul landing page) we want to check if the user is
      // an admin of the platform he's trying to access.
      const platformUser = await this.platformUserRepository.findOne(
        {
          platform: { id: Number(platform_id) },
          user: { id: userJwt.userId },
        },
        { relations: ['user'] },
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
