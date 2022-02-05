import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';

import { UserRole } from 'src/roles/role.enum';

const REDIRECT_URI_REGEX =
  /^(https:\/\/((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3})))(\:\d+)?(\/[-a-z\d%_.~+*]*)*|^(http(s){0,1}:\/\/localhost\/[-a-z\d%_.~+*]*)|^\/[-a-z\d%_.~+*]*/;

export class PlatformIdParamDto {
  @Type(() => Number)
  @IsInt()
  platformId: number;
}

export class SetUserPlatformRoleQueryParamsDto {
  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[] = [UserRole.MEMBER];
}

export class SetUserPlatformRoleParamsDto {
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @Type(() => Number)
  @IsInt()
  userId: number;
}

export class RemovePlatformUserParamsDto {
  @Type(() => Number)
  @IsInt()
  platformId: number;

  @Type(() => Number)
  @IsInt()
  userId: number;
}

export class CreatePlatformDto {
  @MaxLength(32)
  name: string;

  @IsArray()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @MaxLength(256, { each: true })
  @IsUrl({}, { each: true })
  @Matches(REDIRECT_URI_REGEX, {
    each: true,
    message:
      'Redirect URI must adhere to the follow restrictions ' +
      'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  redirectUris: string[];
}

export class UpdatePlatformDto extends PartialType(CreatePlatformDto) {
  @IsOptional()
  @MaxLength(32)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @MaxLength(256, { each: true })
  @IsUrl({}, { each: true })
  @Matches(REDIRECT_URI_REGEX, {
    each: true,
    message:
      'Redirect URI must adhere to the follow restrictions ' +
      'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  redirectUris?: string[];
}

export class FindAllPlatformsQueryParamDto extends PaginationParamsDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;
}
