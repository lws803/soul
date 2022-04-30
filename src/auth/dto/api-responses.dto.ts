import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';

export class LoginResponseDto {
  @ApiProperty({ name: 'accessToken' })
  @Expose()
  accessToken: string;

  @ApiProperty({ name: 'refreshToken' })
  @Expose()
  refreshToken: string;

  constructor(args: LoginResponseDto) {
    Object.assign(this, args);
  }
}

export class CodeResponseDto {
  @ApiProperty({ name: 'code' })
  @Expose()
  code: string;

  @ApiProperty({ name: 'state' })
  @Expose()
  state: string;

  constructor(args: CodeResponseDto) {
    Object.assign(this, args);
  }
}

export class PlatformLoginResponseDto extends LoginResponseDto {
  @ApiProperty({ name: 'platformId', example: 1 })
  @Expose()
  platformId: number;

  @ApiProperty({ name: 'roles', example: [UserRole.ADMIN, UserRole.MEMBER] })
  @Expose()
  roles: UserRole[];

  constructor(args: PlatformLoginResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}

export class RefreshTokenResponseDto {
  @ApiProperty({ name: 'accessToken' })
  @Expose()
  accessToken: string;

  constructor(args: RefreshTokenResponseDto) {
    Object.assign(this, args);
  }
}

export class RefreshTokenWithPlatformResponseDto extends RefreshTokenResponseDto {
  @ApiProperty({ name: 'platformId', example: 1 })
  @Expose()
  platformId: number;

  @ApiProperty({ name: 'roles', example: [UserRole.ADMIN, UserRole.MEMBER] })
  @Expose()
  roles: UserRole[];

  constructor(args: RefreshTokenWithPlatformResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}
