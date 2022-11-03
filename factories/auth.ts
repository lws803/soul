import { Factory } from 'fishery';
import { RefreshToken } from '@prisma/client';

import { JWTRefreshPayload } from 'src/auth/entities/jwt-refresh-payload.entity';
import { JWTClientCredentialPayload } from 'src/auth/entities/jwt-client-credential-payload.entity';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { TokenType } from 'src/auth/enums/token-type.enum';
import { UserRole } from 'src/roles/role.enum';

import * as factories from './index';

export const refreshTokenEntity = Factory.define<RefreshToken>(() => ({
  id: 1,
  userId: factories.userEntity.build().id,
  user: factories.userEntity.build(),
  isRevoked: false,
  platformUser: factories.platformUserEntity.build(),
  platformUserId: factories.platformUserEntity.build().id,
  expires: new Date('1995-12-19T03:24:00'),
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
}));

export const jwtRefreshPayload = Factory.define<JWTRefreshPayload>(() => ({
  tokenId: refreshTokenEntity.build().id,
  userId: factories.userEntity.build().id,
  tokenType: TokenType.Refresh,
}));

export const jwtPayload = Factory.define<JWTPayload>(() => {
  const oneUser = factories.userEntity.build();
  return {
    userId: oneUser.id,
    username: oneUser.username,
    tokenType: TokenType.Access,
  };
});

export const jwtClientCredentialPayload =
  Factory.define<JWTClientCredentialPayload>(() => ({
    platformId: factories.platformEntity.build().id,
    tokenType: TokenType.ClientAccess,
  }));

export const jwtPayloadWithPlatform = Factory.define<JWTPayload>(() => {
  const oneUser = factories.userEntity.build();
  const onePlatformUser = factories.platformUserEntity.build({
    userId: oneUser.id,
  });
  return {
    userId: oneUser.id,
    username: oneUser.username,
    tokenType: TokenType.Access,
    platformId: onePlatformUser.platformId,
    roles: onePlatformUser.roles as UserRole[],
  };
});

export const jwtRefreshPayloadWithPlatform = Factory.define<JWTRefreshPayload>(
  () => {
    const oneUser = factories.userEntity.build();
    const onePlatformUser = factories.platformUserEntity.build({
      userId: oneUser.id,
    });
    return {
      tokenId: refreshTokenEntity.build().id,
      userId: oneUser.id,
      tokenType: TokenType.Refresh,
      platformId: onePlatformUser.platformId,
      roles: onePlatformUser.roles as UserRole[],
    };
  },
);

export const requestUserObject = Factory.define<{
  tokenType: TokenType;
  username: string;
  userId: number;
}>(() => ({
  tokenType: TokenType.Access,
  username: 'test-user',
  userId: 1,
}));
