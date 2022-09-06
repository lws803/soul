import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/dto/created-at-updated-at.entity';
import { FindOnePlatformResponseEntity } from 'src/platforms/dto/api-responses.entity';
import { FindOneUserResponseEntity } from 'src/users/dto/api-responses.entity';

class FullUserConnectionResponseDto extends CreatedAtUpdatedAtEntity {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'from_user', type: FindOneUserResponseEntity })
  @Expose({ name: 'from_user' })
  @Type(() => FindOneUserResponseEntity)
  fromUser: FindOneUserResponseEntity;

  @ApiProperty({ name: 'to_user', type: FindOneUserResponseEntity })
  @Expose({ name: 'to_user' })
  @Type(() => FindOneUserResponseEntity)
  toUser: FindOneUserResponseEntity;

  @ApiProperty({ name: 'platforms', type: [FindOnePlatformResponseEntity] })
  @Expose()
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[] = [];

  constructor(args: FullUserConnectionResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}

export class CreateUserConnectionResponseDto extends FullUserConnectionResponseDto {
  @ApiProperty({ name: 'is_mutual' })
  @Expose({ name: 'is_mutual' })
  isMutual: boolean;

  constructor(args: CreateUserConnectionResponseDto) {
    super(args);
    this.isMutual = args.isMutual;
  }
}

export class FindOneUserConnectionResponseDto extends FullUserConnectionResponseDto {
  @ApiProperty({ name: 'is_mutual' })
  @Expose({ name: 'is_mutual' })
  isMutual: boolean;

  constructor(args: FindOneUserConnectionResponseDto) {
    super(args);
  }
}

export class FindAllUserConnectionResponseDto {
  @ApiProperty({
    name: 'user_connections',
    type: [FullUserConnectionResponseDto],
  })
  @Expose({ name: 'user_connections' })
  @Type(() => FullUserConnectionResponseDto)
  userConnections: FullUserConnectionResponseDto[];

  @ApiProperty({ name: 'total_count', example: 100 })
  @Expose({ name: 'total_count' })
  totalCount: number;

  constructor(args: FindAllUserConnectionResponseDto) {
    Object.assign(this, args);
  }
}

export class AddNewPlatformToUserConnectionResponseDto extends FullUserConnectionResponseDto {
  constructor(args: FullUserConnectionResponseDto) {
    super(args);
  }
}
