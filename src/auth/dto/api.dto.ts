import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';

import { IsValidRedirectUri } from 'src/common/validators/is-valid-redirect-uri.validator';

export class PlatformIdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformId?: number;
}

export class RefreshTokenBodyDto {
  @IsString()
  refreshToken: string;
}

export class CodeQueryParamDto {
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @IsString()
  @IsValidRedirectUri()
  callback: string;
}

export class ValidateQueryParamDto {
  @IsString()
  code: string;

  @IsString()
  @IsValidRedirectUri()
  callback: string;
}
