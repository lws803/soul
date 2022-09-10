import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import {
  ApiResponseProperty,
  ExposeApiResponseProperty,
} from 'src/common/serializers/decorators';

class FullUserResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'id', example: 1234 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({ name: 'username', example: 'johndoe' })
  @ExposeApiResponseProperty()
  username: string;

  @ApiResponseProperty({ name: 'user_handle', example: 'johndoe#1234' })
  @ExposeApiResponseProperty({ name: 'user_handle' })
  userHandle: string;

  @ApiResponseProperty({ name: 'email', example: 'john@email.com' })
  @ExposeApiResponseProperty()
  email: string;

  @ApiResponseProperty({ name: 'is_active', example: false })
  @ExposeApiResponseProperty({ name: 'is_active' })
  isActive: boolean;
}

export class CreateUserResponseEntity extends FullUserResponseEntity {}

export class FindMeResponseEntity extends FullUserResponseEntity {}

export class UpdateUserResponseEntity extends FullUserResponseEntity {}

export class FindOneUserResponseEntity {
  @ApiResponseProperty({ name: 'id', example: 1234 })
  @ExposeApiResponseProperty()
  id: number;

  @ApiResponseProperty({ name: 'username', example: 'johndoe' })
  @ExposeApiResponseProperty()
  username: string;

  @ApiResponseProperty({ name: 'user_handle', example: 'johndoe#1234' })
  @ExposeApiResponseProperty({ name: 'user_handle' })
  userHandle: string;
}

export class FindAllUserResponseEntity {
  @ApiResponseProperty({
    name: 'users',
    type: [FindOneUserResponseEntity],
  })
  @ExposeApiResponseProperty()
  @Type(() => FindOneUserResponseEntity)
  users: FindOneUserResponseEntity[];

  @ApiResponseProperty({ name: 'total_count', example: 10 })
  @ExposeApiResponseProperty({ name: 'total_count' })
  totalCount: number;
}
