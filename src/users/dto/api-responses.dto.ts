import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CreatedAtUpdatedAtDto } from 'src/common/dto/created-at-updated-at.dto';

class FullUserResponseDto extends CreatedAtUpdatedAtDto {
  @ApiProperty({ name: 'id', example: 1234 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'username', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ name: 'user_handle', example: 'johndoe#1234' })
  @Expose({ name: 'user_handle' })
  userHandle: string;

  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @Expose()
  email: string;

  @ApiProperty({ name: 'is_active', example: false })
  @Expose({ name: 'is_active' })
  isActive: boolean;

  constructor(args: FullUserResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}

export class CreateUserResponseDto extends FullUserResponseDto {
  constructor(args: CreateUserResponseDto) {
    super(args);
  }
}

export class GetMeUserResponseDto extends FullUserResponseDto {
  constructor(args: GetMeUserResponseDto) {
    super(args);
  }
}

export class UpdateUserResponseDto extends FullUserResponseDto {
  constructor(args: UpdateUserResponseDto) {
    super(args);
  }
}

export class FindOneUserResponseDto {
  @ApiProperty({ name: 'id', example: 1234 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'username', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ name: 'user_handle', example: 'johndoe#1234' })
  @Expose({ name: 'user_handle' })
  userHandle: string;

  constructor(args: FindOneUserResponseDto) {
    Object.assign(this, args);
  }
}

export class FindAllUserResponseDto {
  @ApiProperty({
    name: 'users',
    type: [FindOneUserResponseDto],
  })
  @Expose()
  @Type(() => FindOneUserResponseDto)
  users: FindOneUserResponseDto[];

  @ApiProperty({ name: 'total_count', example: 10 })
  @Expose({ name: 'total_count' })
  totalCount: number;

  constructor(args: FindAllUserResponseDto) {
    Object.assign(this, args);
  }
}
