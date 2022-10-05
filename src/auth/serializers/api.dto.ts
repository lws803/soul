import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';

import { IsValidRedirectUri } from 'src/common/validators/is-valid-redirect-uri.validator';

import { GrantType } from '../enums/grant-type.enum';

export class RefreshTokenBodyDto {
  @ApiProperty({ name: 'refresh_token' })
  @Expose({ name: 'refresh_token' })
  @IsString({ message: 'refresh_token must be a string' })
  refreshToken: string;

  @ApiProperty({
    name: 'client_id',
    required: true,
    type: Number,
    description: 'Platform id of a platform.',
  })
  @Expose({ name: 'client_id' })
  @Type(() => Number)
  @IsInt({ message: 'client_id must be an integer' })
  platformId: number;

  @ApiProperty({
    name: 'grant_type',
    required: false,
    enum: [GrantType.RefreshToken],
    description: 'Grant type for this authorization operation.',
  })
  @IsOptional()
  @Expose({ name: 'grant_type' })
  @IsEnum([GrantType.RefreshToken], {
    message: `grant_type must be ${GrantType.RefreshToken}`,
  })
  grantType?: GrantType;
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
  @IsInt({ message: 'client_id must be an integer' })
  platformId: number;

  @ApiProperty({
    name: 'redirect_uri',
    example: 'http://localhost:3000',
    type: String,
  })
  @Expose({ name: 'redirect_uri' })
  @IsString({ message: 'redirect_uri must be a string' })
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
  @IsString({ message: 'state must be a string' })
  state: string;

  @ApiProperty({
    name: 'code_challenge',
    type: String,
    description:
      'Code challenge for PKCE flow. See https://tools.ietf.org/html/rfc7636',
  })
  @Expose({ name: 'code_challenge' })
  @IsString({ message: 'code_challenge must be a string' })
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
  @IsString({ message: 'redirect_uri must be a string' })
  @IsValidRedirectUri()
  callback: string;

  @ApiProperty({
    name: 'code_verifier',
    type: String,
    description:
      'Code verifier for PKCE flow. See https://tools.ietf.org/html/rfc7636',
  })
  @Expose({ name: 'code_verifier' })
  @IsString({ message: 'code_verifier must be a string' })
  codeVerifier: string;

  @ApiProperty({
    name: 'grant_type',
    required: false,
    enum: [GrantType.AuthorizationCode],
    description: 'Grant type for this authorization operation.',
  })
  @IsOptional()
  @Expose({ name: 'grant_type' })
  @IsEnum([GrantType.AuthorizationCode], {
    message: `grant_type must be ${GrantType.AuthorizationCode}`,
  })
  grantType?: GrantType;
}

export class AuthenticateClientBodyDto {
  @ApiProperty({ name: 'client_secret' })
  @Expose({ name: 'client_secret' })
  @IsString({ message: 'client_secret must be a string' })
  clientSecret: string;

  @ApiProperty({
    name: 'client_id',
    required: true,
    type: Number,
    description: 'Platform id of a platform.',
  })
  @Expose({ name: 'client_id' })
  @Type(() => Number)
  @IsInt({ message: 'client_id must be an integer' })
  platformId: number;

  @ApiProperty({
    name: 'grant_type',
    required: false,
    enum: [GrantType.ClientCredentials],
    description: 'Grant type for this authorization operation.',
  })
  @IsOptional()
  @Expose({ name: 'grant_type' })
  @IsEnum([GrantType.ClientCredentials], {
    message: `grant_type must be ${GrantType.ClientCredentials}`,
  })
  grantType?: GrantType;
}
