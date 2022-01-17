import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';

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
