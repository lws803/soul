import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { FindOnePlatformResponseDto } from 'src/platforms/dto/api-responses.dto';
import { FindOneUserResponseDto } from 'src/users/dto/api-responses.dto';

class FullUserConnectionResponseDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'fromUser', type: FindOneUserResponseDto })
  @Expose()
  @Type(() => FindOneUserResponseDto)
  fromUser: FindOneUserResponseDto;

  @ApiProperty({ name: 'toUser', type: FindOneUserResponseDto })
  @Expose()
  @Type(() => FindOneUserResponseDto)
  toUser: FindOneUserResponseDto;

  @ApiProperty({ name: 'platforms', type: [FindOnePlatformResponseDto] })
  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platforms: FindOnePlatformResponseDto[] = [];

  @ApiProperty({ name: 'createdAt', type: Date })
  @Expose()
  createdAt: Date;

  @ApiProperty({ name: 'updatedAt', type: Date })
  @Expose()
  updatedAt: Date;

  constructor(args: FullUserConnectionResponseDto) {
    Object.assign(this, args);
  }
}

export class CreateUserConnectionResponseDto extends FullUserConnectionResponseDto {
  @Expose() isMutual: boolean;

  constructor(args: CreateUserConnectionResponseDto) {
    super(args);
    this.isMutual = args.isMutual;
  }
}

export class FindOneUserConnectionResponseDto extends FullUserConnectionResponseDto {
  constructor(args: FindOneUserConnectionResponseDto) {
    super(args);
  }
}

export class FindAllUserConnectionResponseDto {
  @ApiProperty({
    name: 'userConnections',
    type: [FullUserConnectionResponseDto],
  })
  @Expose()
  @Type(() => FullUserConnectionResponseDto)
  userConnections: FullUserConnectionResponseDto[];

  @ApiProperty({ name: 'totalCount', example: 100 })
  @Expose()
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
