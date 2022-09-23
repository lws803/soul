import { Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import { ApiResponseProperty } from 'src/common/serializers/decorators';

class FullUserResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1234,
    description: 'ID of the user.',
  })
  id: number;

  @ApiResponseProperty({
    name: 'username',
    example: 'johndoe',
    description:
      'Username for the user. This is commonly used for identifying a specific user.',
  })
  username: string;

  @ApiResponseProperty({
    name: 'user_handle',
    example: 'johndoe#1234',
    description:
      'User handle is constructed using the username and user id. ' +
      'There is currently no real use case for this yet, but it might be used for ' +
      'searching/retrieving users in the future.',
  })
  userHandle: string;

  @ApiResponseProperty({
    name: 'email',
    example: 'john@email.com',
    description:
      'Email address used for signing up this user. Do note that this email will also be used for ' +
      'sending password reset requests and user account confirmation.',
  })
  email: string;

  @ApiResponseProperty({
    name: 'is_active',
    example: false,
    description:
      'This field will be set to false if a user has not verified his/her account yet ' +
      'from the email that was sent out during account creation. However, in case it was ' +
      'lost or expired, it is also possible to request for a new verification email ' +
      'here: https://login.soul-network.com/request-email-verification',
  })
  isActive: boolean;

  @ApiResponseProperty({
    name: 'bio',
    description: 'User bio, more information about oneself.',
  })
  bio?: string | null = null;

  @ApiResponseProperty({
    name: 'display_name',
    example: 'John Doe',
    description:
      'More display-friendly name, usually used to display on a user interface.',
  })
  displayName?: string | null = null;
}

export class CreateUserResponseEntity extends FullUserResponseEntity {}

export class FindMeResponseEntity extends FullUserResponseEntity {}

export class UpdateUserResponseEntity extends FullUserResponseEntity {}

export class FindOneUserResponseEntity {
  @ApiResponseProperty({
    name: 'id',
    example: 1234,
    description: 'ID of the user.',
  })
  id: number;

  @ApiResponseProperty({
    name: 'username',
    example: 'johndoe',
    description:
      'Username for the user. This is commonly used for identifying a specific user.',
  })
  username: string;

  @ApiResponseProperty({
    name: 'user_handle',
    example: 'johndoe#1234',
    description:
      'User handle is constructed using the username and user id. ' +
      'There is currently no real use case for this yet, but it might be used for ' +
      'searching/retrieving users in the future.',
  })
  userHandle: string;

  @ApiResponseProperty({
    name: 'bio',
    description: 'User bio, more information about oneself.',
  })
  bio?: string | null = null;

  @ApiResponseProperty({
    name: 'display_name',
    example: 'John Doe',
    description:
      'More display-friendly name, usually used to display on a user interface.',
  })
  displayName?: string | null = null;
}

export class FindAllUserResponseEntity {
  @ApiResponseProperty({
    name: 'users',
    type: [FindOneUserResponseEntity],
  })
  @Type(() => FindOneUserResponseEntity)
  users: FindOneUserResponseEntity[];

  @ApiResponseProperty({
    name: 'total_count',
    example: 10,
    description:
      'Total count is used to determine the total number of users irregardless of pagination.',
  })
  totalCount: number;
}
