import {
  ApiResponseProperty,
  ExposeApiResponseProperty,
} from 'src/common/serializers/decorators';

export class ReputationResponseEntity {
  @ApiResponseProperty({ name: 'reputation', example: 12 })
  @ExposeApiResponseProperty()
  reputation: number;

  @ApiResponseProperty({ name: 'user_id', example: 1234 })
  @ExposeApiResponseProperty({ name: 'user_id' })
  userId: number;
}
