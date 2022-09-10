import { ApiResponseProperty } from 'src/common/serializers/decorators';

export class ReputationResponseEntity {
  @ApiResponseProperty({ name: 'reputation', example: 12 })
  reputation: number;

  @ApiResponseProperty({ name: 'user_id', example: 1234 })
  userId: number;
}
