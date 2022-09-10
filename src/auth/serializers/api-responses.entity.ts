import {
  ApiResponseProperty,
  ExposeApiResponseProperty,
} from 'src/common/serializers/decorators';
import { UserRole } from 'src/roles/role.enum';

export class LoginResponseEntity {
  @ApiResponseProperty({ name: 'access_token' })
  @ExposeApiResponseProperty({ name: 'access_token' })
  accessToken: string;

  @ApiResponseProperty({ name: 'refresh_token' })
  @ExposeApiResponseProperty({ name: 'refresh_token' })
  refreshToken: string;

  @ApiResponseProperty({ name: 'expires_in' })
  @ExposeApiResponseProperty({ name: 'expires_in' })
  expiresIn: number;
}

export class CodeResponseEntity {
  @ApiResponseProperty({ name: 'code' })
  @ExposeApiResponseProperty()
  code: string;

  @ApiResponseProperty({ name: 'state' })
  @ExposeApiResponseProperty()
  state: string;
}

export class PlatformLoginResponseEntity extends LoginResponseEntity {
  @ApiResponseProperty({ name: 'platform_id', example: 1 })
  @ExposeApiResponseProperty({ name: 'platform_id' })
  platformId: number;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
  })
  @ExposeApiResponseProperty()
  roles: UserRole[];
}

export class RefreshTokenResponseEntity {
  @ApiResponseProperty({ name: 'access_token' })
  @ExposeApiResponseProperty({ name: 'access_token' })
  accessToken: string;

  @ApiResponseProperty({ name: 'refresh_token' })
  @ExposeApiResponseProperty({ name: 'refresh_token' })
  refreshToken: string;

  @ApiResponseProperty({ name: 'expires_in' })
  @ExposeApiResponseProperty({ name: 'expires_in' })
  expiresIn: number;
}

export class RefreshTokenWithPlatformResponseEntity extends RefreshTokenResponseEntity {
  @ApiResponseProperty({ name: 'platform_id', example: 1 })
  @ExposeApiResponseProperty({ name: 'platform_id' })
  platformId: number;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
  })
  @ExposeApiResponseProperty()
  roles: UserRole[];
}
