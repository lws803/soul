import { Expose, Type } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';
import { FindOneUserResponseDto } from 'src/users/dto/api-responses.dto';

class FullPlatformResponseDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() nameHandle: string;
  @Expose() hostUrl: string;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

  constructor(args: FullPlatformResponseDto) {
    Object.assign(this, args);
  }
}

export class CreatePlatformResponseDto extends FullPlatformResponseDto {
  constructor(args: CreatePlatformResponseDto) {
    super(args);
  }
}

export class UpdatePlatformResponseDto extends FullPlatformResponseDto {
  constructor(args: UpdatePlatformResponseDto) {
    super(args);
  }
}

export class FindOnePlatformResponseDto extends FullPlatformResponseDto {
  constructor(args: FindOnePlatformResponseDto) {
    super(args);
  }
}

export class FindAllPlatformResponseDto {
  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platforms: FindOnePlatformResponseDto[];

  @Expose() totalCount: number;

  constructor(args: FindAllPlatformResponseDto) {
    Object.assign(this, args);
  }
}

class FindOnePlatformUserResponseDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => FindOneUserResponseDto)
  user: FindOneUserResponseDto;

  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platform: FindOnePlatformResponseDto;

  @Expose()
  roles: UserRole[];

  constructor(args: FindOnePlatformUserResponseDto) {
    Object.assign(this, args);
  }
}

export class FindAllPlatformUsersResponseDto {
  @Expose()
  @Type(() => FindOnePlatformUserResponseDto)
  platformUsers: FindOnePlatformUserResponseDto[];

  @Expose() totalCount: number;

  constructor(args: FindAllPlatformUsersResponseDto) {
    Object.assign(this, args);
  }
}

export class SetPlatformUserRoleResponseDto extends FindOnePlatformUserResponseDto {
  constructor(args: SetPlatformUserRoleResponseDto) {
    super(args);
  }
}
