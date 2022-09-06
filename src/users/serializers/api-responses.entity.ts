import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/dto/created-at-updated-at.entity';

class FullUserResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiProperty({ name: 'id', example: 1234 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({ name: 'username', example: 'johndoe' })
  @Expose({ toPlainOnly: true })
  username: string;

  @ApiProperty({ name: 'user_handle', example: 'johndoe#1234' })
  @Expose({ name: 'user_handle', toPlainOnly: true })
  userHandle: string;

  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @Expose({ toPlainOnly: true })
  email: string;

  @ApiProperty({ name: 'is_active', example: false })
  @Expose({ name: 'is_active', toPlainOnly: true })
  isActive: boolean;
}

export class CreateUserResponseEntity extends FullUserResponseEntity {}

export class FindMeResponseEntity extends FullUserResponseEntity {}

export class UpdateUserResponseEntity extends FullUserResponseEntity {}

export class FindOneUserResponseEntity {
  @ApiProperty({ name: 'id', example: 1234 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({ name: 'username', example: 'johndoe' })
  @Expose({ toPlainOnly: true })
  username: string;

  @ApiProperty({ name: 'user_handle', example: 'johndoe#1234' })
  @Expose({ name: 'user_handle', toPlainOnly: true })
  userHandle: string;
}

export class FindAllUserResponseEntity {
  @ApiProperty({
    name: 'users',
    type: [FindOneUserResponseEntity],
  })
  @Expose({ toPlainOnly: true })
  @Type(() => FindOneUserResponseEntity)
  users: FindOneUserResponseEntity[];

  @ApiProperty({ name: 'total_count', example: 10 })
  @Expose({ name: 'total_count', toPlainOnly: true })
  totalCount: number;
}
