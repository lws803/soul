import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

import { PaginationParamsDto } from 'src/common/serializers/pagination-params.dto';

import { ConnectionType } from '../enums/connection-type.enum';

export class PostPlatformDto {
  @ApiProperty({ name: 'platform_id', example: 1 })
  @Expose({ name: 'platform_id' })
  @IsInt({ message: 'platform_id must be an integer' })
  platformId: number;
}

export class CreateUserConnectionDto {
  @ApiProperty({ name: 'from_user_id', example: 1234 })
  @Expose({ name: 'from_user_id' })
  @IsInt({ message: 'from_user_id must be an integer' })
  fromUserId: number;

  @ApiProperty({ name: 'to_user_id', example: 12345 })
  @Expose({ name: 'to_user_id' })
  @IsInt({ message: 'to_user_id must be an integer' })
  toUserId: number;

  @ApiProperty({ name: 'platform_id', example: 1, required: false })
  @Expose({ name: 'platform_id' })
  @IsOptional()
  @IsInt({ message: 'platform_id must be an integer' })
  platformId?: number;
}

export class UserConnectionParamsDto {
  @ApiProperty({
    name: 'id',
    example: 1,
    description: 'User connection id',
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  id: number;
}

export class ByUserIdsParamsDto {
  @ApiProperty({
    name: 'from_user_id',
    example: 1234,
    type: Number,
  })
  @Expose({ name: 'from_user_id' })
  @Type(() => Number)
  @IsInt({ message: 'from_user_id must be an integer' })
  fromUserId: number;

  @ApiProperty({
    name: 'to_user_id',
    example: 12345,
    type: Number,
  })
  @Expose({ name: 'to_user_id' })
  @Type(() => Number)
  @IsInt({ message: 'to_user_id must be an integer' })
  toUserId: number;
}

export class FindMyUserConnectionsQueryParamsDto extends PaginationParamsDto {
  @ApiProperty({
    name: 'connection_type',
    example: ConnectionType.Mutual,
    type: String,
  })
  @Expose({ name: 'connection_type' })
  @IsEnum(ConnectionType, {
    message:
      'connection_type must be a valid connection type: ' +
      `${ConnectionType.Following}, ${ConnectionType.Follower}, ${ConnectionType.Mutual}`,
  })
  connectionType: ConnectionType;

  @ApiProperty({
    name: 'platform_id',
    example: 1,
    type: Number,
    required: false,
  })
  @Expose({ name: 'platform_id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'platform_id must be an integer' })
  platformId?: number;
}

export class RemovePlatformFromUserConnectionParamsDto {
  @ApiProperty({
    name: 'id',
    type: Number,
    description: 'User connection id',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({
    name: 'platform_id',
    type: Number,
    description: 'Platform id',
    example: 1,
  })
  @Expose({ name: 'platform_id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'platform_id must be an integer' })
  platformId?: number;
}
