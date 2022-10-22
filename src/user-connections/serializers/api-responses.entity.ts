import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import { ApiResponseProperty } from 'src/common/serializers/decorators';
import {
  FindOnePlatformResponseEntity,
  FindOnePlatformUserResponseEntity,
} from 'src/platforms/serializers/api-responses.entity';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

class FullUserConnectionResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1,
    description: 'ID of a user connection.',
  })
  id: number;

  @ApiResponseProperty({
    name: 'from_user',
    type: FindOneUserResponseEntity,
    description: 'User connection from a specified user.',
  })
  @Type(() => FindOneUserResponseEntity)
  fromUser?: FindOneUserResponseEntity;

  @ApiResponseProperty({
    name: 'to_user',
    type: FindOneUserResponseEntity,
    description: 'User connection to a specified user.',
  })
  @Type(() => FindOneUserResponseEntity)
  toUser?: FindOneUserResponseEntity;

  @ApiResponseProperty({
    name: 'from_platform_user',
    type: FindOnePlatformUserResponseEntity,
    description: 'User connection from specified platform user.',
  })
  @Type(() => FindOnePlatformResponseEntity)
  fromPlatformUser?: FindOnePlatformUserResponseEntity;

  @ApiResponseProperty({
    name: 'to_platform_user',
    type: FindOnePlatformUserResponseEntity,
    description: 'User connection to specified platform user.',
  })
  @Type(() => FindOnePlatformResponseEntity)
  toPlatformUser?: FindOnePlatformUserResponseEntity;

  @ApiResponseProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseEntity],
    description: 'Platforms this user connection is associated with.',
  })
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[] = [];
}

export class CreateUserConnectionResponseEntity extends FullUserConnectionResponseEntity {
  @ApiResponseProperty({
    name: 'is_mutual',
    description:
      'Identifies if this platform is a mutual connection, ' +
      'i.e. there is an exact opposite connection for the same pair of users.',
  })
  isMutual: boolean;
}

export class FindOneUserConnectionResponseEntity extends FullUserConnectionResponseEntity {
  @ApiResponseProperty({
    name: 'is_mutual',
    description:
      'Identifies if this platform is a mutual connection, ' +
      'i.e. there is an exact opposite connection for the same pair of users.',
  })
  isMutual: boolean;
}

export class FindAllUserConnectionResponseEntity {
  @ApiResponseProperty({
    name: 'user_connections',
    type: [FullUserConnectionResponseEntity],
  })
  @Type(() => FullUserConnectionResponseEntity)
  userConnections: FullUserConnectionResponseEntity[];

  @ApiResponseProperty({
    name: 'total_count',
    example: 100,
    description:
      'Total count is used to determine the total number of user connections irregardless of pagination.',
  })
  totalCount: number;
}

export class AddNewPlatformToUserConnectionResponseEntity extends FullUserConnectionResponseEntity {}
