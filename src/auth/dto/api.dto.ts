import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';

import { IsValidRedirectUri } from 'src/common/validators/is-valid-redirect-uri.validator';

export class RefreshTokenBodyDto {
  @ApiProperty({ name: 'refresh_token' })
  @Expose({ name: 'refresh_token' })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    name: 'client_id',
    required: false,
    type: Number,
    description: 'Platform id of a platform.',
  })
  @Expose({ name: 'client_id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformId?: number;
}

export class CodeQueryParamDto {
  @ApiProperty({
    name: 'client_id',
    example: 1,
    type: Number,
    description: 'Platform id of a platform.',
  })
  @Expose({ name: 'client_id' })
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @ApiProperty({
    name: 'redirect_uri',
    example: 'http://localhost:3000',
    type: String,
  })
  @Expose({ name: 'redirect_uri' })
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

  @ApiProperty({
    name: 'code_challenge',
    type: String,
    description:
      'Code challenge for PKCE flow. See https://tools.ietf.org/html/rfc7636',
  })
  @Expose({ name: 'code_challenge' })
  @IsString()
  codeChallenge: string;
}

export class ValidateBodyDto {
  @ApiProperty({ name: 'code', type: String })
  @IsString()
  code: string;

  @ApiProperty({
    name: 'redirect_uri',
    example: 'http://localhost:3000',
    type: String,
  })
  @Expose({ name: 'redirect_uri' })
  @IsString()
  @IsValidRedirectUri()
  callback: string;

  @ApiProperty({
    name: 'code_verifier',
    type: String,
    description:
      'Code verifier for PKCE flow. See https://tools.ietf.org/html/rfc7636',
  })
  @Expose({ name: 'code_verifier' })
  @IsString()
  codeVerifier: string;

  @Expose({ name: 'grant_type' })
  @IsOptional()
  @IsString()
  grantType?: string;
}
