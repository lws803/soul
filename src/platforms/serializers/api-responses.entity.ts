import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import { UserRole } from 'src/roles/role.enum';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

export class PlatformCategoryResponseEntity {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({
    name: 'name',
    description: 'One of predefined category names for the platform.',
    example: 'tech',
  })
  @Expose({ toPlainOnly: true })
  name: string;
}

export class FullPlatformResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @Expose({ toPlainOnly: true })
  name: string;

  @ApiProperty({
    name: 'name_handle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @Expose({ name: 'name_handle', toPlainOnly: true })
  nameHandle: string;

  @ApiProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @Expose({ name: 'is_verified', toPlainOnly: true })
  isVerified: boolean;

  @ApiProperty({
    name: 'activity_webhook_uri',
    example: 'https://example.com',
    description: 'Webhook URI for Soul to broadcast user activity.',
    required: false,
  })
  @Expose({ name: 'activity_webhook_uri', toPlainOnly: true })
  activityWebhookUri?: string;

  @ApiProperty({
    name: 'redirect_uris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @Expose({ name: 'redirect_uris', toPlainOnly: true })
  redirectUris: string[];

  @ApiProperty({ name: 'category', type: PlatformCategoryResponseEntity })
  @Expose({ toPlainOnly: true })
  @Type(() => PlatformCategoryResponseEntity)
  category?: PlatformCategoryResponseEntity;
}

export class CreatePlatformResponseEntity extends FullPlatformResponseEntity {}

export class UpdatePlatformResponseEntity extends FullPlatformResponseEntity {}

export class FindOnePlatformResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @Expose({ toPlainOnly: true })
  name: string;

  @ApiProperty({
    name: 'name_handle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @Expose({ name: 'name_handle', toPlainOnly: true })
  nameHandle: string;

  @ApiProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @Expose({ name: 'is_verified', toPlainOnly: true })
  isVerified: boolean;

  @ApiProperty({ name: 'category', type: PlatformCategoryResponseEntity })
  @Expose({ toPlainOnly: true })
  @Type(() => PlatformCategoryResponseEntity)
  category?: PlatformCategoryResponseEntity;
}

export class FindAllPlatformResponseEntity {
  @ApiProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseEntity],
  })
  @Expose({ toPlainOnly: true })
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[];

  @ApiProperty({ name: 'total_count', example: 100 })
  @Expose({ name: 'total_count', toPlainOnly: true })
  totalCount: number;
}

class FindOnePlatformUserResponseEntity {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({ name: 'user', type: FindOneUserResponseEntity })
  @Expose({ toPlainOnly: true })
  @Type(() => FindOneUserResponseEntity)
  user: FindOneUserResponseEntity;

  @ApiProperty({ name: 'platform', type: FindOnePlatformResponseEntity })
  @Expose({ toPlainOnly: true })
  @Type(() => FindOnePlatformResponseEntity)
  platform: FindOnePlatformResponseEntity;

  @ApiProperty({ name: 'roles', example: [UserRole.Admin] })
  @Expose({ toPlainOnly: true })
  roles: UserRole[];
}

export class FindAllPlatformUsersResponseEntity {
  @ApiProperty({
    name: 'platform_users',
    type: [FindOnePlatformUserResponseEntity],
  })
  @Expose({ name: 'platform_users', toPlainOnly: true })
  @Type(() => FindOnePlatformUserResponseEntity)
  platformUsers: FindOnePlatformUserResponseEntity[];

  @ApiProperty({ name: 'total_count', example: 100 })
  @Expose({ name: 'total_count', toPlainOnly: true })
  totalCount: number;
}

export class SetPlatformUserRoleResponseEntity extends FindOnePlatformUserResponseEntity {}

export class CreatePlatformUserResponseEntity extends FindOnePlatformUserResponseEntity {}
