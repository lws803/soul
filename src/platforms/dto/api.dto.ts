import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  @ApiProperty({ name: 'platformId', example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  platformId: number;
}

export class SetUserPlatformRoleQueryParamsDto {
  @ApiProperty({
    name: 'roles',
    example: 'admin,member',
    type: String,
    required: true,
    description: 'Comma separated list of roles',
  })
  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[] = [UserRole.MEMBER];
}

export class SetUserPlatformRoleParamsDto {
  @ApiProperty({ name: 'platformId', example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @ApiProperty({ name: 'userId', example: 1234, type: Number })
  @Type(() => Number)
  @IsInt()
  userId: number;
}

export class RemovePlatformUserParamsDto {
  @ApiProperty({ name: 'platformId', example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @ApiProperty({ name: 'userId', example: 1234, type: Number })
  @Type(() => Number)
  @IsInt()
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
    name: 'redirectUris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsValidRedirectUri({ each: true })
  redirectUris: string[];
}

export class UpdatePlatformDto extends PartialType(CreatePlatformDto) {
  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @IsOptional()
  @MaxLength(32)
  name?: string;

  @ApiProperty({
    name: 'redirectUris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsValidRedirectUri({ each: true })
  redirectUris?: string[];
}

export class FindAllPlatformsQueryParamDto extends PaginationParamsDto {
  @ApiProperty({
    name: 'isVerified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;
}
