import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  MaxLength,
} from 'class-validator';

import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';
import { IsValidRedirectUri } from 'src/common/validators/is-valid-redirect-uri.validator';

import { UserRole } from 'src/roles/role.enum';

export class PlatformIdParamDto {
  @ApiProperty({ name: 'platform_id', example: 1, type: Number })
  @Expose({ name: 'platform_id' })
  @Type(() => Number)
  @IsInt({ message: 'platform_id must be an integer' })
  platformId: number;
}

export class SetUserPlatformRoleQueryParamsDto {
  @ApiProperty({
    name: 'roles',
    example: 'admin,member',
    type: String,
    description: 'Comma separated list of roles',
  })
  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[] = [UserRole.Member];
}

export class SetUserPlatformRoleParamsDto {
  @ApiProperty({ name: 'platform_id', example: 1, type: Number })
  @Expose({ name: 'platform_id' })
  @Type(() => Number)
  @IsInt({ message: 'platform_id must be an integer' })
  platformId: number;

  @ApiProperty({ name: 'user_id', example: 1234, type: Number })
  @Expose({ name: 'user_id' })
  @Type(() => Number)
  @IsInt({ message: 'user_id must be an integer' })
  userId: number;
}

export class RemovePlatformUserParamsDto {
  @ApiProperty({ name: 'platform_id', example: 1, type: Number })
  @Expose({ name: 'platform_id' })
  @Type(() => Number)
  @IsInt({ message: 'platform_id must be an integer' })
  platformId: number;

  @ApiProperty({ name: 'user_id', example: 1234, type: Number })
  @Expose({ name: 'user_id' })
  @Type(() => Number)
  @IsInt({ message: 'user_id must be an integer' })
  userId: number;
}

export class CreatePlatformDto {
  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @MaxLength(32)
  name: string;

  @ApiProperty({
    name: 'redirect_uris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @Expose({ name: 'redirect_uris' })
  @IsArray({ message: 'redirect_uris must be an array of urls' })
  @ArrayMaxSize(10, { message: 'redirect_uris must have at most 10 urls' })
  @ArrayMinSize(1, { message: 'redirect_uris must have at least 1 url' })
  @IsValidRedirectUri({ each: true })
  redirectUris: string[];

  @ApiProperty({
    name: 'category',
    description: 'One of predefined categories for this platform.',
    example: 'tech',
    required: false,
  })
  @IsOptional()
  @MaxLength(32)
  category?: string;
}

export class UpdatePlatformDto extends PartialType(CreatePlatformDto) {}

export class FindAllPlatformsQueryParamDto extends PaginationParamsDto {
  @ApiProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
    required: false,
  })
  @Expose({ name: 'is_verified' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'is_verified must be a boolean' })
  isVerified?: boolean;

  @ApiProperty({
    name: 'q',
    example: 'soul',
    description: 'Search query',
    required: false,
  })
  @IsOptional()
  @MaxLength(32)
  q?: string;

  @ApiProperty({
    name: 'category',
    description: 'One of predefined categories for this platform.',
    example: 'tech',
    required: false,
  })
  @IsOptional()
  @MaxLength(32)
  category?: string;
}
