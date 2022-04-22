import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';
import { FindOneUserResponseDto } from 'src/users/dto/api-responses.dto';

class FullPlatformResponseDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @Expose()
  name: string;

  @ApiProperty({
    name: 'nameHandle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @Expose()
  nameHandle: string;

  @ApiProperty({
    name: 'isVerified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    name: 'createdAt',
    example: '2022-02-06T15:27:53.385Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    name: 'updatedAt',
    example: '2022-02-06T15:27:53.385Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    name: 'redirectUris',
    example: ['https://example.com', 'http://localhost:3000'],
    description:
      'List of redirect uris for the platform, they must follow the following restrictions ' +
      'defined in https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
  })
  @Expose()
  redirectUris: string[];

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

export class FindOnePlatformResponseDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    name: 'name',
    example: 'soul',
    description: 'Name of the platform',
  })
  @Expose()
  name: string;

  @ApiProperty({
    name: 'nameHandle',
    example: 'soul#1',
    description: 'Includes the id number after the # symbol',
  })
  @Expose()
  nameHandle: string;

  @ApiProperty({
    name: 'isVerified',
    example: true,
    description: 'Is the platform verified, used only for official platforms',
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    name: 'createdAt',
    example: '2022-02-06T15:27:53.385Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    name: 'updatedAt',
    example: '2022-02-06T15:27:53.385Z',
  })
  @Expose()
  updatedAt: Date;

  constructor(args: FindOnePlatformResponseDto) {
    Object.assign(this, args);
  }
}

export class FindAllPlatformResponseDto {
  @ApiProperty({
    name: 'platforms',
    type: [FindOnePlatformResponseDto],
  })
  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platforms: FindOnePlatformResponseDto[];

  @ApiProperty({ name: 'totalCount', example: 100 })
  @Expose()
  totalCount: number;

  constructor(args: FindAllPlatformResponseDto) {
    Object.assign(this, args);
  }
}

class FindOnePlatformUserResponseDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    name: 'user',
    type: FindOneUserResponseDto,
  })
  @Expose()
  @Type(() => FindOneUserResponseDto)
  user: FindOneUserResponseDto;

  @ApiProperty({ name: 'platform', type: FindOnePlatformResponseDto })
  @Expose()
  @Type(() => FindOnePlatformResponseDto)
  platform: FindOnePlatformResponseDto;

  @ApiProperty({ name: 'roles', example: [UserRole.ADMIN] })
  @Expose()
  roles: UserRole[];

  constructor(args: FindOnePlatformUserResponseDto) {
    Object.assign(this, args);
  }
}

export class FindAllPlatformUsersResponseDto {
  @ApiProperty({
    name: 'platformUsers',
    type: [FindOnePlatformUserResponseDto],
  })
  @Expose()
  @Type(() => FindOnePlatformUserResponseDto)
  platformUsers: FindOnePlatformUserResponseDto[];

  @ApiProperty({ name: 'totalCount', example: 100 })
  @Expose()
  totalCount: number;

  constructor(args: FindAllPlatformUsersResponseDto) {
    Object.assign(this, args);
  }
}

export class SetPlatformUserRoleResponseDto extends FindOnePlatformUserResponseDto {
  constructor(args: SetPlatformUserRoleResponseDto) {
    super(args);
  }
}

export class CreatePlatformUserResponseDto extends FindOnePlatformUserResponseDto {
  constructor(args: CreatePlatformUserResponseDto) {
    super(args);
  }
}
