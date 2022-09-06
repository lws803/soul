import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CreatedAtUpdatedAtEntity } from 'src/common/serializers/created-at-updated-at.entity';
import { FindOnePlatformResponseEntity } from 'src/platforms/serializers/api-responses.entity';
import { FindOneUserResponseEntity } from 'src/users/serializers/api-responses.entity';

class FullUserConnectionResponseEntity extends CreatedAtUpdatedAtEntity {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose({ toPlainOnly: true })
  id: number;

  @ApiProperty({ name: 'from_user', type: FindOneUserResponseEntity })
  @Expose({ name: 'from_user', toPlainOnly: true })
  @Type(() => FindOneUserResponseEntity)
  fromUser: FindOneUserResponseEntity;

  @ApiProperty({ name: 'to_user', type: FindOneUserResponseEntity })
  @Expose({ name: 'to_user', toPlainOnly: true })
  @Type(() => FindOneUserResponseEntity)
  toUser: FindOneUserResponseEntity;

  @ApiProperty({ name: 'platforms', type: [FindOnePlatformResponseEntity] })
  @Expose({ toPlainOnly: true })
  @Type(() => FindOnePlatformResponseEntity)
  platforms: FindOnePlatformResponseEntity[] = [];
}

export class CreateUserConnectionResponseEntity extends FullUserConnectionResponseEntity {
  @ApiProperty({ name: 'is_mutual' })
  @Expose({ name: 'is_mutual', toPlainOnly: true })
  isMutual: boolean;
}

export class FindOneUserConnectionResponseEntity extends FullUserConnectionResponseEntity {
  @ApiProperty({ name: 'is_mutual' })
  @Expose({ name: 'is_mutual', toPlainOnly: true })
  isMutual: boolean;
}

export class FindAllUserConnectionResponseEntity {
  @ApiProperty({
    name: 'user_connections',
    type: [FullUserConnectionResponseEntity],
  })
  @Expose({ name: 'user_connections', toPlainOnly: true })
  @Type(() => FullUserConnectionResponseEntity)
  userConnections: FullUserConnectionResponseEntity[];

  @ApiProperty({ name: 'total_count', example: 100 })
  @Expose({ name: 'total_count', toPlainOnly: true })
  totalCount: number;
}

export class AddNewPlatformToUserConnectionResponseEntity extends FullUserConnectionResponseEntity {}
