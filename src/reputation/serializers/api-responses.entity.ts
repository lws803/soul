import { Type } from 'class-transformer';

import { ApiResponseProperty } from 'src/common/serializers/decorators';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

export class ReputationResponseEntity {
  @ApiResponseProperty({
    name: 'reputation',
    example: 12,
    description: 'Reputation score calculated for the specified user.',
  })
  reputation: number;

  @ApiResponseProperty({ name: 'user', type: FindOneUserResponseEntity })
  @Type(() => FindOneUserResponseEntity)
  user: FindOneUserResponseEntity;
}
