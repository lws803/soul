import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

import { ConnectionType } from '../enums/connection-type.enum';

export class PostPlatformDto {
  @IsNumber()
  platformId: number;
}

export class CreateUserConnectionDto {
  @IsNumber()
  fromUserId: number;

  @IsNumber()
  toUserId: number;

  @IsOptional()
  @IsNumber()
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

export class PlatformIdParamDto {
  @Type(() => Number)
  @IsInt()
  platformId: number;
}

export class FindMyUserConnectionsQueryParamsDto {
  @IsEnum(ConnectionType)
  connectionType: ConnectionType;
}
