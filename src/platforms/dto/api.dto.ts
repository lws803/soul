import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';

import { UserRole } from 'src/roles/role.enum';

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

export class RemovePLatformUserParamsDto {
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

  @IsUrl()
  hostUrl: string;
}

export class UpdatePlatformDto extends PartialType(CreatePlatformDto) {
  @IsOptional()
  @MaxLength(32)
  name?: string;

  @IsOptional()
  @IsUrl()
  hostUrl?: string;
}

export class FindAllPlatformsQueryParamDto extends PaginationParamsDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;
}
