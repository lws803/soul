import { Factory } from 'fishery';

import * as factories from './index';

import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { JWTRefreshPayload } from 'src/auth/entities/jwt-refresh-payload.entity';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { TokenType } from 'src/auth/enums/token-type.enum';

export const refreshToken = Factory.define<RefreshToken>(() => ({
  id: 1,
  user: factories.oneUser.build(),
  isRevoked: false,
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  expires: new Date('1995-12-19T03:24:00'),
  platformUser: factories.onePlatformUser.build(),
}));

export const jwtRefreshPayload = Factory.define<JWTRefreshPayload>(() => ({
  tokenId: refreshToken.build().id,
  userId: factories.oneUser.build().id,
  tokenType: TokenType.REFRESH,
}));

export const jwtPayload = Factory.define<JWTPayload>(() => ({
  userId: factories.oneUser.build().id,
  username: factories.oneUser.build().username,
  tokenType: TokenType.ACCESS,
}));

export const jwtPayloadWithPlatform = Factory.define<JWTPayload>(() => ({
  userId: factories.oneUser.build().id,
  username: factories.oneUser.build().username,
  tokenType: TokenType.ACCESS,
  platformId: factories.onePlatformUser.build().platform.id,
  roles: factories.onePlatformUser.build().roles,
}));

export const jwtRefreshPayloadWithPlatform = Factory.define<JWTRefreshPayload>(
  () => ({
    tokenId: refreshToken.build().id,
    userId: factories.oneUser.build().id,
    tokenType: TokenType.REFRESH,
    platformId: factories.onePlatformUser.build().platform.id,
    roles: factories.onePlatformUser.build().roles,
  }),
);

export const requestUserObject = Factory.define<{
  tokenType: TokenType;
  username: string;
  userId: number;
}>(() => ({
  tokenType: TokenType.ACCESS,
  username: 'TEST_USER',
  userId: 1,
}));
