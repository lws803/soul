import { Type } from 'class-transformer';

import { ApiResponseProperty } from 'src/common/serializers/decorators';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

export class FollowActivityResponseEntity {
  @ApiResponseProperty({
    name: 'from_user',
    type: FindOneUserResponseEntity,
  })
  @Type(() => FindOneUserResponseEntity)
  fromUser: FindOneUserResponseEntity;

  @ApiResponseProperty({
    name: 'to_user',
    type: FindOneUserResponseEntity,
  })
  @Type(() => FindOneUserResponseEntity)
  toUser: FindOneUserResponseEntity;

  @ApiResponseProperty({ name: 'type', enum: ['FOLLOW'] })
  type: 'FOLLOW';
}
