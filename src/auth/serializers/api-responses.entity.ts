import { ApiResponseProperty } from 'src/common/serializers/decorators';
import { UserRole } from 'src/roles/role.enum';

export class LoginResponseEntity {
  @ApiResponseProperty({
    name: 'access_token',
    description:
      'Token used for access to resources that requires authentication. ' +
      'Use this as a bearer token.',
  })
  accessToken: string;

  @ApiResponseProperty({
    name: 'expires_in',
    description: 'Time for access token to expire (in seconds).',
  })
  expiresIn: number;
}

export class CodeResponseEntity {
  @ApiResponseProperty({
    name: 'code',
    description: "Code used by platform to exchange for user's access token.",
  })
  code: string;

  @ApiResponseProperty({
    name: 'state',
    description:
      'Initial state provided by the platform. This state is mainly used for platforms to ' +
      'determine which state they should return authenticated users to, prior to logging in.',
  })
  state: string;
}

export class PlatformLoginResponseEntity extends LoginResponseEntity {
  @ApiResponseProperty({
    name: 'platform_id',
    example: 1,
    description: 'ID of the platform.',
  })
  platformId: number;

  @ApiResponseProperty({
    name: 'refresh_token',
    description: 'Token used for obtaining a new access token after expiry.',
  })
  refreshToken: string;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
    description: 'User roles for a platform.',
    enum: Object.values(UserRole),
    type: [UserRole],
  })
  roles: UserRole[];
}

class RefreshTokenResponseEntity {
  @ApiResponseProperty({
    name: 'access_token',
    description:
      'Token used for access to resources that requires authentication. ' +
      'Use this as a bearer token.',
  })
  accessToken: string;

  @ApiResponseProperty({
    name: 'refresh_token',
    description: 'Token used for obtaining a new access token after expiry.',
  })
  refreshToken: string;

  @ApiResponseProperty({
    name: 'expires_in',
    description: 'Time for access token to expire (in seconds).',
  })
  expiresIn: number;
}

export class RefreshTokenWithPlatformResponseEntity extends RefreshTokenResponseEntity {
  @ApiResponseProperty({
    name: 'platform_id',
    example: 1,
    description: 'ID of the platform.',
  })
  platformId: number;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
    description: 'User roles for a platform.',
    enum: Object.values(UserRole),
    type: [UserRole],
  })
  roles: UserRole[];
}

export class ClientAuthenticateResponseEntity {
  @ApiResponseProperty({
    name: 'access_token',
    description:
      'Token used for access to resources that requires client authentication. ' +
      'Use this as a bearer token.',
  })
  accessToken: string;

  @ApiResponseProperty({
    name: 'expires_in',
    description: 'Time for access token to expire (in seconds).',
  })
  expiresIn: number;
}
