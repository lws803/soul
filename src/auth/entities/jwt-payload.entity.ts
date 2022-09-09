import { Type } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';

import { TokenType } from '../enums/token-type.enum';

export class JWTPayload {
  username: string;
  userId: number;
  tokenType = TokenType.Access;

  @Type(() => Number)
  platformId?: number;

  roles?: UserRole[];
}
