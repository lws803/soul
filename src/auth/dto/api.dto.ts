import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';

import { IsValidRedirectUri } from 'src/common/validators/is-valid-redirect-uri.validator';

export class PlatformIdQueryDto {
  @ApiProperty({ name: 'platformId', required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformId?: number;
}

export class RefreshTokenBodyDto {
  @ApiProperty({ name: 'refreshToken' })
  @IsString()
  refreshToken: string;
}

export class CodeQueryParamDto {
  @ApiProperty({ name: 'platformId', example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @ApiProperty({
    name: 'callback',
    example: 'http://localhost:3000',
    type: String,
  })
  @IsString()
  @IsValidRedirectUri()
  callback: string;

  @ApiProperty({
    name: 'state',
    type: String,
    description:
      'State which will be passed down together with the code as a query parameter to the callback url. ' +
      'Use this state param to mitigate CSRF attacks and point your platform to the ' +
      'correct state upon successful login.',
  })
  @IsString()
  state: string;
}

export class ValidateQueryParamDto {
  @ApiProperty({ name: 'code', type: String })
  @IsString()
  code: string;

  @ApiProperty({
    name: 'callback',
    example: 'http://localhost:3000',
    type: String,
  })
  @IsString()
  @IsValidRedirectUri()
  callback: string;
}
