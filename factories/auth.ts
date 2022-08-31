import { Factory } from 'fishery';

import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { JWTRefreshPayload } from 'src/auth/entities/jwt-refresh-payload.entity';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { TokenType } from 'src/auth/enums/token-type.enum';

import * as factories from './index';

export const refreshToken = Factory.define<RefreshToken>(() => ({
  id: 1,
  user: factories.user.build(),
  isRevoked: false,
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  expires: new Date('1995-12-19T03:24:00'),
  platformUser: factories.platformUser.build(),
}));

export const jwtRefreshPayload = Factory.define<JWTRefreshPayload>(() => ({
  tokenId: refreshToken.build().id,
  userId: factories.user.build().id,
  tokenType: TokenType.Refresh,
}));

export const jwtPayload = Factory.define<JWTPayload>(() => {
  const oneUser = factories.user.build();
  return {
    userId: oneUser.id,
    username: oneUser.username,
    tokenType: TokenType.Access,
  };
});

export const jwtPayloadWithPlatform = Factory.define<JWTPayload>(() => {
  const oneUser = factories.user.build();
  const onePlatformUser = factories.platformUser.build({ user: oneUser });
  return {
    userId: oneUser.id,
    username: oneUser.username,
    tokenType: TokenType.Access,
    platformId: onePlatformUser.platform.id,
    roles: onePlatformUser.roles,
  };
});

export const jwtRefreshPayloadWithPlatform = Factory.define<JWTRefreshPayload>(
  () => {
    const oneUser = factories.user.build();
    const onePlatformUser = factories.platformUser.build({ user: oneUser });
    return {
      tokenId: refreshToken.build().id,
      userId: oneUser.id,
      tokenType: TokenType.Refresh,
      platformId: onePlatformUser.platform.id,
      roles: onePlatformUser.roles,
    };
  },
);

export const requestUserObject = Factory.define<{
  tokenType: TokenType;
  username: string;
  userId: number;
}>(() => ({
  tokenType: TokenType.Access,
  username: 'TEST_USER',
  userId: 1,
}));
