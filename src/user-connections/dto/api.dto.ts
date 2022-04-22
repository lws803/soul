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

  @ApiProperty({ name: 'platformId', example: 1 })
  @IsOptional()
  @IsInt()
  platformId?: number;
}

export class UserConnectionParamsDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}

export class ByUserIdsParamsDto {
  @Type(() => Number)
  @IsInt()
  fromUserId: number;

  @Type(() => Number)
  @IsInt()
  toUserId: number;
}

export class FindMyUserConnectionsQueryParamsDto extends PaginationParamsDto {
  @IsEnum(ConnectionType)
  connectionType: ConnectionType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformId?: number;
}

export class RemovePlatformFromUserConnectionParamsDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformId?: number;
}
