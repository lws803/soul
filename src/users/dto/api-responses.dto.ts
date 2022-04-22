import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class FullUserResponseDto {
  @ApiProperty({ name: 'id', example: 1234 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'username', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ name: 'userHandle', example: 'johndoe#1234' })
  @Expose()
  userHandle: string;

  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @Expose()
  email: string;

  @ApiProperty({ name: 'isActive', example: false })
  @Expose()
  isActive: boolean;

  @ApiProperty({ name: 'createdAt', type: Date })
  @Expose()
  createdAt: Date;

  @ApiProperty({ name: 'updatedAt', type: Date })
  @Expose()
  updatedAt: Date;

  constructor(args: FullUserResponseDto) {
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

  @ApiProperty({ name: 'userHandle', example: 'johndoe#1234' })
  @Expose()
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

  @ApiProperty({ name: 'totalCount', example: 10 })
  @Expose()
  totalCount: number;

  constructor(args: FindAllUserResponseDto) {
    Object.assign(this, args);
  }
}
