import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import {
  ApiResponseProperty,
  ExposeApiResponseProperty,
} from 'src/common/serializers/decorators';
import { UserRole } from 'src/roles/role.enum';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

export class PlatformCategoryResponseEntity {
  @ApiResponseProperty({ name: 'id', example: 1 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({
    name: 'name',
    description: 'One of predefined category names for the platform.',
    example: 'tech',
  })
  @ExposeApiResponseProperty()
  name: string;
}

export class FullPlatformResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'id', example: 1 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @ExposeApiResponseProperty()
  name: string;

  @ApiResponseProperty({
    name: 'name_handle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @ExposeApiResponseProperty({ name: 'name_handle' })
  nameHandle: string;

  @ApiResponseProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @ExposeApiResponseProperty({ name: 'is_verified' })
  isVerified: boolean;

  @ApiResponseProperty({
    name: 'activity_webhook_uri',
    example: 'https://example.com',
    description: 'Webhook URI for Soul to broadcast user activity.',
  })
  @ExposeApiResponseProperty({ name: 'activity_webhook_uri' })
  activityWebhookUri?: string;

  @ApiResponseProperty({
    name: 'redirect_uris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @ExposeApiResponseProperty({ name: 'redirect_uris' })
  redirectUris: string[];

  @ApiResponseProperty({
    name: 'category',
    type: PlatformCategoryResponseEntity,
  })
  @ExposeApiResponseProperty()
  @Type(() => PlatformCategoryResponseEntity)
  category?: PlatformCategoryResponseEntity;
}

export class CreatePlatformResponseEntity extends FullPlatformResponseEntity {}

export class UpdatePlatformResponseEntity extends FullPlatformResponseEntity {}

export class FindOnePlatformResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'id', example: 1 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @ExposeApiResponseProperty()
  name: string;

  @ApiResponseProperty({
    name: 'name_handle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @ExposeApiResponseProperty({ name: 'name_handle' })
  nameHandle: string;

  @ApiResponseProperty({
    name: 'is_verified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @ExposeApiResponseProperty({ name: 'is_verified' })
  isVerified: boolean;

  @ApiResponseProperty({
    name: 'category',
    type: PlatformCategoryResponseEntity,
  })
  @ExposeApiResponseProperty()
  @Type(() => PlatformCategoryResponseEntity)
  category?: PlatformCategoryResponseEntity;
}

export class FindAllPlatformResponseEntity {
  @ApiResponseProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseEntity],
  })
  @ExposeApiResponseProperty()
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[];

  @ApiResponseProperty({ name: 'total_count', example: 100 })
  @ExposeApiResponseProperty({ name: 'total_count' })
  totalCount: number;
}

class FindOnePlatformUserResponseEntity {
  @ApiResponseProperty({ name: 'id', example: 1 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({ name: 'user', type: FindOneUserResponseEntity })
  @ExposeApiResponseProperty()
  @Type(() => FindOneUserResponseEntity)
  user: FindOneUserResponseEntity;

  @ApiResponseProperty({
    name: 'platform',
    type: FindOnePlatformResponseEntity,
  })
  @ExposeApiResponseProperty()
  @Type(() => FindOnePlatformResponseEntity)
  platform: FindOnePlatformResponseEntity;

  @ApiResponseProperty({ name: 'roles', example: [UserRole.Admin] })
  @ExposeApiResponseProperty()
  roles: UserRole[];
}

export class FindAllPlatformUsersResponseEntity {
  @ApiResponseProperty({
    name: 'platform_users',
    type: [FindOnePlatformUserResponseEntity],
  })
  @ExposeApiResponseProperty({ name: 'platform_users' })
  @Type(() => FindOnePlatformUserResponseEntity)
  platformUsers: FindOnePlatformUserResponseEntity[];

  @ApiResponseProperty({ name: 'total_count', example: 100 })
  @ExposeApiResponseProperty({ name: 'total_count' })
  totalCount: number;
}

export class SetPlatformUserRoleResponseEntity extends FindOnePlatformUserResponseEntity {}

export class CreatePlatformUserResponseEntity extends FindOnePlatformUserResponseEntity {}
