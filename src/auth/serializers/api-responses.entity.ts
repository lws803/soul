import { ApiResponseProperty } from 'src/common/serializers/decorators';
import { UserRole } from 'src/roles/role.enum';

export class LoginResponseEntity {
  @ApiResponseProperty({ name: 'access_token' })
  accessToken: string;

  @ApiResponseProperty({ name: 'refresh_token' })
  refreshToken: string;

  @ApiResponseProperty({ name: 'expires_in' })
  expiresIn: number;
}

export class CodeResponseEntity {
  @ApiResponseProperty({ name: 'code' })
  code: string;

  @ApiResponseProperty({ name: 'state' })
  state: string;
}

export class PlatformLoginResponseEntity extends LoginResponseEntity {
  @ApiResponseProperty({ name: 'platform_id', example: 1 })
  platformId: number;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
  })
  roles: UserRole[];
}

export class RefreshTokenResponseEntity {
  @ApiResponseProperty({ name: 'access_token' })
  accessToken: string;

  @ApiResponseProperty({ name: 'refresh_token' })
  refreshToken: string;

  @ApiResponseProperty({ name: 'expires_in' })
  expiresIn: number;
}

export class RefreshTokenWithPlatformResponseEntity extends RefreshTokenResponseEntity {
  @ApiResponseProperty({ name: 'platform_id', example: 1 })
  platformId: number;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
  })
  roles: UserRole[];
}
