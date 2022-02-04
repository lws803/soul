import { Type } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';

import { TokenType } from '../enums/token-type.enum';

export class JWTPayload {
  username: string;
  userId: number;
  tokenType = TokenType.ACCESS;

  @Type(() => Number)
  platformId?: number;

  roles?: UserRole[];

  constructor(args: JWTArgs | JWTArgsWithPlatform) {
    Object.assign(this, args);
  }
}

type JWTArgs = {
  username: string;
  userId: number;
};

type JWTArgsWithPlatform = JWTArgs & {
  platformId: number;
  roles: UserRole[];
};
