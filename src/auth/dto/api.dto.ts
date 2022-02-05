import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator';

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

  @IsUrl()
  callback: string;
}

export class ValidateQueryParamDto {
  @IsString()
  code: string;

  @IsUrl()
  callback: string;
}
