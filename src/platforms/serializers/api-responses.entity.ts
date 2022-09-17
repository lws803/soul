import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import { ApiResponseProperty } from 'src/common/serializers/decorators';
import { UserRole } from 'src/roles/role.enum';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

export class PlatformCategoryResponseEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1,
    description: 'ID of a platform category.',
  })
  id: number;

  @ApiResponseProperty({
    name: 'name',
    description: 'A predefined category name for platforms.',
    example: 'journalism',
  })
  name: string;
}

export class FullPlatformResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1,
    description: 'ID of the platform.',
  })
  id: number;

  @ApiResponseProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  name: string;

  @ApiResponseProperty({
    name: 'name_handle',
    example: 'soul#1',
    description:
      'Name handle is constructed using the name and ID of the platform. ' +
      'ID is present after the # symbol.',
  })
  nameHandle: string;

  @ApiResponseProperty({
    name: 'is_verified',
    example: true,
    description:
      'Used to identify verified platforms, used only for official platforms',
  })
  isVerified: boolean;

  @ApiResponseProperty({
    name: 'activity_webhook_uri',
    example: 'https://example.com',
    description: 'Webhook URI for Soul to broadcast user activity.',
  })
  activityWebhookUri?: string;

  @ApiResponseProperty({
    name: 'redirect_uris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  redirectUris: string[];

  @ApiResponseProperty({
    name: 'category',
    type: PlatformCategoryResponseEntity,
    description: 'Categories associated with this platform.',
  })
  @Type(() => PlatformCategoryResponseEntity)
  category?: PlatformCategoryResponseEntity;
}

export class CreatePlatformResponseEntity extends FullPlatformResponseEntity {}

export class UpdatePlatformResponseEntity extends FullPlatformResponseEntity {}

export class FindOnePlatformResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1,
    description: 'ID of the platform.',
  })
  id: number;

  @ApiResponseProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  name: string;

  @ApiResponseProperty({
    name: 'name_handle',
    example: 'soul#1',
    description:
      'Name handle is constructed using the name and ID of the platform. ' +
      'ID is present after the # symbol.',
  })
  nameHandle: string;

  @ApiResponseProperty({
    name: 'is_verified',
    example: true,
    description:
      'Used to identify verified platforms, used only for official platforms',
  })
  isVerified: boolean;

  @ApiResponseProperty({
    name: 'category',
    type: PlatformCategoryResponseEntity,
    description: 'Categories associated with this platform.',
  })
  @Type(() => PlatformCategoryResponseEntity)
  category?: PlatformCategoryResponseEntity;
}

export class FindAllPlatformResponseEntity {
  @ApiResponseProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseEntity],
  })
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[];

  @ApiResponseProperty({
    name: 'total_count',
    example: 10,
    description:
      'Total count is used to determine the total number of platforms irregardless of pagination.',
  })
  totalCount: number;
}

class FindOnePlatformUserResponseEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1,
    description: 'ID of a platform user.',
  })
  id: number;

  @ApiResponseProperty({ name: 'user', type: FindOneUserResponseEntity })
  @Type(() => FindOneUserResponseEntity)
  user: FindOneUserResponseEntity;

  @ApiResponseProperty({
    name: 'platform',
    type: FindOnePlatformResponseEntity,
  })
  @Type(() => FindOnePlatformResponseEntity)
  platform: FindOnePlatformResponseEntity;

  @ApiResponseProperty({
    name: 'roles',
    example: [UserRole.Admin, UserRole.Member],
    description: 'User roles for a platform.',
    enum: Object.values(UserRole),
    type: [UserRole],
  })
  roles: UserRole[];
}

export class FindAllPlatformUsersResponseEntity {
  @ApiResponseProperty({
    name: 'platform_users',
    type: [FindOnePlatformUserResponseEntity],
  })
  @Type(() => FindOnePlatformUserResponseEntity)
  platformUsers: FindOnePlatformUserResponseEntity[];

  @ApiResponseProperty({
    name: 'total_count',
    example: 100,
    description:
      'Total count is used to determine the total number of platform users irregardless of pagination.',
  })
  totalCount: number;
}

export class SetPlatformUserRoleResponseEntity extends FindOnePlatformUserResponseEntity {}

export class CreatePlatformUserResponseEntity extends FindOnePlatformUserResponseEntity {}
