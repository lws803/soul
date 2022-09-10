import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import { ApiResponseProperty } from 'src/common/serializers/decorators';

class FullUserResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'id', example: 1234 })
  id: number;

  @ApiResponseProperty({ name: 'username', example: 'johndoe' })
  username: string;

  @ApiResponseProperty({ name: 'user_handle', example: 'johndoe#1234' })
  userHandle: string;

  @ApiResponseProperty({ name: 'email', example: 'john@email.com' })
  email: string;

  @ApiResponseProperty({ name: 'is_active', example: false })
  isActive: boolean;
}

export class CreateUserResponseEntity extends FullUserResponseEntity {}

export class FindMeResponseEntity extends FullUserResponseEntity {}

export class UpdateUserResponseEntity extends FullUserResponseEntity {}

export class FindOneUserResponseEntity {
  @ApiResponseProperty({ name: 'id', example: 1234 })
  id: number;

  @ApiResponseProperty({ name: 'username', example: 'johndoe' })
  username: string;

  @ApiResponseProperty({ name: 'user_handle', example: 'johndoe#1234' })
  userHandle: string;
}

export class FindAllUserResponseEntity {
  @ApiResponseProperty({
    name: 'users',
    type: [FindOneUserResponseEntity],
  })
  @Type(() => FindOneUserResponseEntity)
  users: FindOneUserResponseEntity[];

  @ApiResponseProperty({ name: 'total_count', example: 10 })
  totalCount: number;
}
