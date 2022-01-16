import { Expose, Type } from 'class-transformer';

import { FindOnePlatformResponseDto } from 'src/platforms/dto/api-responses.dto';
import { FindOneUserResponseDto } from 'src/users/dto/api-responses.dto';

class FullUserConnectionResponseDto {
  @Expose() id: number;

  @Expose()
  @Type(() => FindOneUserResponseDto)
  fromUser: FindOneUserResponseDto;

  @Expose()
  @Type(() => FindOneUserResponseDto)
  toUser: FindOneUserResponseDto;

  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platforms: FindOnePlatformResponseDto[] = [];

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

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
  @Expose()
  @Type(() => FullUserConnectionResponseDto)
  userConnections: FullUserConnectionResponseDto[];

  @Expose() totalCount: number;

  constructor(args: FindAllUserConnectionResponseDto) {
    Object.assign(this, args);
  }
}

export class AddNewPlatformToUserConnectionResponseDto extends FullUserConnectionResponseDto {
  constructor(args: FullUserConnectionResponseDto) {
    super(args);
  }
}
