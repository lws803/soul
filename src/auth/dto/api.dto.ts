import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PlatformIdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  platformId?: number;
}

export class RefreshTokenBodyDto {
  @IsString()
  refreshToken: string;
}
