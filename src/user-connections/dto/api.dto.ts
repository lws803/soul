import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';

import { ConnectionType } from '../enums/connection-type.enum';

export class PostPlatformDto {
  @IsInt()
  platformId: number;
}

export class CreateUserConnectionDto {
  @IsInt()
  fromUserId: number;

  @IsInt()
  toUserId: number;

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
