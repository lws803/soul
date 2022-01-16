import { UserRole } from 'src/roles/role.enum';

import { TokenType } from '../enums/token-type.enum';

export class JWTRefreshPayload {
  tokenId: number;
  userId: number;
  tokenType = TokenType.REFRESH;
  platformId?: number;
  roles?: UserRole[];

  constructor(args: JWTArgsWithPlatform | JWTArgs) {
    Object.assign(this, args);
  }
}

type JWTArgs = {
  tokenId: number;
  userId: number;
};

type JWTArgsWithPlatform = JWTArgs & {
  platformId: number;
  roles: UserRole[];
};

const JWTArgsWithPlatform = {
  isJWTArgsWithPlatform: (
    obj: JWTArgs | JWTArgsWithPlatform,
  ): obj is JWTArgsWithPlatform => {
    return 'platformId' in obj && 'role' in obj;
  },
};
