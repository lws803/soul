import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CreatedAtUpdatedAtDto } from 'src/common/dto/created-at-updated-at.dto';
import { UserRole } from 'src/roles/role.enum';
import { FindOneUserResponseEntity } from 'src/users/dto/api-responses.entity';

export class PlatformCategoryResponseDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    name: 'name',
    description: 'One of predefined category names for the platform.',
    example: 'tech',
  })
  @Expose()
  name: string;

  constructor(args: PlatformCategoryResponseDto) {
    Object.assign(this, args);
  }
}

export class FullPlatformResponseDto extends CreatedAtUpdatedAtDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @Expose()
  name: string;

  @ApiProperty({
    name: 'name_handle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @Expose({ name: 'name_handle' })
  nameHandle: string;

  @ApiProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @Expose({ name: 'is_verified' })
  isVerified: boolean;

  @ApiProperty({
    name: 'activity_webhook_uri',
    example: 'https://example.com',
    description: 'Webhook URI for Soul to broadcast user activity.',
    required: false,
  })
  @Expose({ name: 'activity_webhook_uri' })
  activityWebhookUri?: string;

  @ApiProperty({
    name: 'redirect_uris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @Expose({ name: 'redirect_uris' })
  redirectUris: string[];

  @ApiProperty({ name: 'category', type: PlatformCategoryResponseDto })
  @Expose()
  @Type(() => PlatformCategoryResponseDto)
  category?: PlatformCategoryResponseDto;

  constructor(args: FullPlatformResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}

export class CreatePlatformResponseDto extends FullPlatformResponseDto {
  constructor(args: CreatePlatformResponseDto) {
    super(args);
  }
}

export class UpdatePlatformResponseDto extends FullPlatformResponseDto {
  constructor(args: UpdatePlatformResponseDto) {
    super(args);
  }
}

export class FindOnePlatformResponseDto extends CreatedAtUpdatedAtDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @Expose()
  name: string;

  @ApiProperty({
    name: 'name_handle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @Expose({ name: 'name_handle' })
  nameHandle: string;

  @ApiProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @Expose({ name: 'is_verified' })
  isVerified: boolean;

  @ApiProperty({ name: 'category', type: PlatformCategoryResponseDto })
  @Expose()
  @Type(() => PlatformCategoryResponseDto)
  category?: PlatformCategoryResponseDto;

  constructor(args: FindOnePlatformResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}

export class FindAllPlatformResponseDto {
  @ApiProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseDto],
  })
  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platforms: FindOnePlatformResponseDto[];

  @ApiProperty({ name: 'total_count', example: 100 })
  @Expose({ name: 'total_count' })
  totalCount: number;

  constructor(args: FindAllPlatformResponseDto) {
    Object.assign(this, args);
  }
}

class FindOnePlatformUserResponseDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'user', type: FindOneUserResponseEntity })
  @Expose()
  @Type(() => FindOneUserResponseEntity)
  user: FindOneUserResponseEntity;

  @ApiProperty({ name: 'platform', type: FindOnePlatformResponseDto })
  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platform: FindOnePlatformResponseDto;

  @ApiProperty({ name: 'roles', example: [UserRole.Admin] })
  @Expose()
  roles: UserRole[];

  constructor(args: FindOnePlatformUserResponseDto) {
    Object.assign(this, args);
  }
}

export class FindAllPlatformUsersResponseDto {
  @ApiProperty({
    name: 'platform_users',
    type: [FindOnePlatformUserResponseDto],
  })
  @Expose({ name: 'platform_users' })
  @Type(() => FindOnePlatformUserResponseDto)
  platformUsers: FindOnePlatformUserResponseDto[];

  @ApiProperty({ name: 'total_count', example: 100 })
  @Expose({ name: 'total_count' })
  totalCount: number;

  constructor(args: FindAllPlatformUsersResponseDto) {
    Object.assign(this, args);
  }
}

export class SetPlatformUserRoleResponseDto extends FindOnePlatformUserResponseDto {
  constructor(args: SetPlatformUserRoleResponseDto) {
    super(args);
  }
}

export class CreatePlatformUserResponseDto extends FindOnePlatformUserResponseDto {
  constructor(args: CreatePlatformUserResponseDto) {
    super(args);
  }
}
