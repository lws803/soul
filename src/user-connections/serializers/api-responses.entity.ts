import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import {
  ApiResponseProperty,
  ExposeApiResponseProperty,
} from 'src/common/serializers/decorators';
import { FindOnePlatformResponseEntity } from 'src/platforms/serializers/api-responses.entity';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

class FullUserConnectionResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'id', example: 1 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({ name: 'from_user', type: FindOneUserResponseEntity })
  @ExposeApiResponseProperty({ name: 'from_user' })
  @Type(() => FindOneUserResponseEntity)
  fromUser: FindOneUserResponseEntity;

  @ApiResponseProperty({ name: 'to_user', type: FindOneUserResponseEntity })
  @ExposeApiResponseProperty({ name: 'to_user' })
  @Type(() => FindOneUserResponseEntity)
  toUser: FindOneUserResponseEntity;

  @ApiResponseProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseEntity],
  })
  @ExposeApiResponseProperty()
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[] = [];
}

export class CreateUserConnectionResponseEntity extends FullUserConnectionResponseEntity {
  @ApiResponseProperty({ name: 'is_mutual' })
  @ExposeApiResponseProperty({ name: 'is_mutual' })
  isMutual: boolean;
}

export class FindOneUserConnectionResponseEntity extends FullUserConnectionResponseEntity {
  @ApiResponseProperty({ name: 'is_mutual' })
  @ExposeApiResponseProperty({ name: 'is_mutual' })
  isMutual: boolean;
}

export class FindAllUserConnectionResponseEntity {
  @ApiResponseProperty({
    name: 'user_connections',
    type: [FullUserConnectionResponseEntity],
  })
  @ExposeApiResponseProperty({ name: 'user_connections' })
  @Type(() => FullUserConnectionResponseEntity)
  userConnections: FullUserConnectionResponseEntity[];

  @ApiResponseProperty({ name: 'total_count', example: 100 })
  @ExposeApiResponseProperty({ name: 'total_count' })
  totalCount: number;
}

export class AddNewPlatformToUserConnectionResponseEntity extends FullUserConnectionResponseEntity {}
