import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';

export class LoginResponseEntity {
  @ApiProperty({ name: 'access_token' })
  @Expose({ name: 'access_token', toPlainOnly: true })
  accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  @Expose({ name: 'refresh_token', toPlainOnly: true })
  refreshToken: string;

  @ApiProperty({ name: 'expires_in' })
  @Expose({ name: 'expires_in', toPlainOnly: true })
  expiresIn: number;
}

export class CodeResponseEntity {
  @ApiProperty({ name: 'code' })
  @Expose({ toPlainOnly: true })
  code: string;

  @ApiProperty({ name: 'state' })
  @Expose({ toPlainOnly: true })
  state: string;
}

export class PlatformLoginResponseEntity extends LoginResponseEntity {
  @ApiProperty({ name: 'platform_id', example: 1 })
  @Expose({ name: 'platform_id', toPlainOnly: true })
  platformId: number;

  @ApiProperty({ name: 'roles', example: [UserRole.Admin, UserRole.Member] })
  @Expose({ toPlainOnly: true })
  roles: UserRole[];
}

export class RefreshTokenResponseEntity {
  @ApiProperty({ name: 'access_token' })
  @Expose({ name: 'access_token', toPlainOnly: true })
  accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  @Expose({ name: 'refresh_token', toPlainOnly: true })
  refreshToken: string;

  @ApiProperty({ name: 'expires_in' })
  @Expose({ name: 'expires_in', toPlainOnly: true })
  expiresIn: number;
}

export class RefreshTokenWithPlatformResponseEntity extends RefreshTokenResponseEntity {
  @ApiProperty({ name: 'platform_id', example: 1 })
  @Expose({ name: 'platform_id', toPlainOnly: true })
  platformId: number;

  @ApiProperty({ name: 'roles', example: [UserRole.Admin, UserRole.Member] })
  @Expose({ toPlainOnly: true })
  roles: UserRole[];
}
