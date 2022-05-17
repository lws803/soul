import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';

import { ConnectionType } from '../enums/connection-type.enum';

export class PostPlatformDto {
  @ApiProperty({ name: 'platformId', example: 1 })
  @IsInt()
  platformId: number;
}

export class CreateUserConnectionDto {
  @ApiProperty({ name: 'fromUserId', example: 1234 })
  @IsInt()
  fromUserId: number;

  @ApiProperty({ name: 'toUserId', example: 12345 })
  @IsInt()
  toUserId: number;

  @ApiProperty({ name: 'platformId', example: 1, required: false })
  @IsOptional()
  @IsInt()
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
    name: 'fromUserId',
    required: false,
    example: 1234,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  fromUserId: number;

  @ApiProperty({
    name: 'toUserId',
    required: false,
    example: 12345,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  toUserId: number;
}

export class FindMyUserConnectionsQueryParamsDto extends PaginationParamsDto {
  @ApiProperty({
    name: 'connectionType',
    example: ConnectionType.Mutual,
    type: String,
  })
  @IsEnum(ConnectionType)
  connectionType: ConnectionType;

  @ApiProperty({
    name: 'platformId',
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
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
    name: 'platformId',
    type: Number,
    description: 'Platform id',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformId?: number;
}
