import { Expose, Type } from 'class-transformer';

class FullUserResponseDto {
  @Expose() id: number;
  @Expose() username: string;
  @Expose() userHandle: string;
  @Expose() email: string;
  @Expose() isActive: boolean;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

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
  @Expose() id: number;
  @Expose() username: string;
  @Expose() userHandle: string;

  constructor(args: FindOneUserResponseDto) {
    Object.assign(this, args);
  }
}

export class FindAllUserResponseDto {
  @Expose()
  @Type(() => FindOneUserResponseDto)
  users: FindOneUserResponseDto[];
  @Expose() totalCount: number;

  constructor(args: FindAllUserResponseDto) {
    Object.assign(this, args);
  }
}
