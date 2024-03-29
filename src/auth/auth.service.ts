import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { classToPlain, plainToClass } from 'class-transformer';
import { TokenExpiredError } from 'jsonwebtoken';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';
import { User } from '@prisma/client';

import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UserRole } from 'src/roles/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

import { JWTPayload } from './entities/jwt-payload.entity';
import { JWTClientCredentialPayload } from './entities/jwt-client-credential-payload.entity';
import { JWTRefreshPayload } from './entities/jwt-refresh-payload.entity';
import { TokenType } from './enums/token-type.enum';
import * as exceptions from './exceptions';
import * as apiResponses from './serializers/api-responses.entity';
import { CodeQueryParamDto, ValidateBodyDto } from './serializers/api.dto';
import { DecodedCode } from './types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private platformService: PlatformsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prismaService: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && (await bcrypt.compare(pass, user.hashedPassword))) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<apiResponses.LoginResponseEntity> {
    if (!user.isActive) {
      throw new exceptions.UserNotVerifiedException();
    }

    return {
      accessToken: await this.generateAccessToken(user),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_TTL'),
    };
  }

  async findCodeForPlatformAndCallback({
    user,
    platformId,
    callback,
    state,
    codeChallenge,
  }: {
    user: User;
  } & CodeQueryParamDto): Promise<apiResponses.CodeResponseEntity> {
    if (!user.isActive) {
      throw new exceptions.UserNotVerifiedException();
    }

    const platform = await this.platformService.findOne(platformId);
    await this.platformService.findOnePlatformUser(platformId, user.id);

    if (!(platform.redirectUris as string[]).includes(callback)) {
      throw new exceptions.InvalidCallbackException();
    }

    const codeChallengeKey = uuidv4();
    await this.cacheManager.set(
      `${this.configService.get('REDIS_DB_KEY_PREFIX')}:${codeChallengeKey}`,
      codeChallenge,
      { ttl: this.configService.get('PKCE_CODE_CHALLENGE_TTL') },
    );

    const decodedCode: DecodedCode = {
      userId: user.id,
      platformId,
      callback,
      codeChallengeKey,
    };
    return {
      code: this.jwtService.sign(
        decodedCode,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
      ),
      state,
    };
  }

  async exchangeCodeForToken({
    code,
    callback,
    codeVerifier,
  }: ValidateBodyDto): Promise<apiResponses.PlatformLoginResponseEntity> {
    let decodedToken: DecodedCode;
    try {
      decodedToken = this.jwtService.verify<DecodedCode>(code);
    } catch (Error) {
      throw new exceptions.InvalidCodeException();
    }

    if (decodedToken.callback !== callback) {
      throw new exceptions.InvalidCallbackException();
    }

    const challengeCode = await this.cacheManager.get(
      `${this.configService.get('REDIS_DB_KEY_PREFIX')}:${
        decodedToken.codeChallengeKey
      }`,
    );

    if (challengeCode !== base64url(sha256(codeVerifier).toString(), 'hex')) {
      await this.cacheManager.del(
        `${this.configService.get('REDIS_DB_KEY_PREFIX')}:${
          decodedToken.codeChallengeKey
        }`,
      );
      throw new exceptions.PKCENotMatchException();
    }

    this.cacheManager.del(
      `${this.configService.get('REDIS_DB_KEY_PREFIX')}:${
        decodedToken.codeChallengeKey
      }`,
    );

    const platformUser = await this.platformService.findOnePlatformUser(
      decodedToken.platformId,
      decodedToken.userId,
    );
    const user = await this.usersService.findOne(decodedToken.userId);
    const roles = platformUser.roles as UserRole[];

    return {
      accessToken: await this.generateAccessToken(
        user,
        decodedToken.platformId,
        roles,
      ),
      refreshToken: await this.generateRefreshToken(
        user,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
        decodedToken.platformId,
        roles,
      ),
      platformId: decodedToken.platformId,
      roles,
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_TTL'),
    };
  }

  async refreshWithPlatform(
    encodedRefreshToken: string,
    platformId: number,
  ): Promise<apiResponses.RefreshTokenWithPlatformResponseEntity> {
    const { token, roles, user } = await this.createAccessTokenFromRefreshToken(
      {
        encodedRefreshToken,
        platformId,
        revokeExistingToken: this.configService.get('REFRESH_TOKEN_ROTATION'),
        deleteExistingToken: !this.configService.get('REFRESH_TOKEN_ROTATION'),
      },
    );

    return {
      accessToken: token,
      platformId,
      roles,
      refreshToken: await this.generateRefreshToken(
        user,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
        platformId,
        roles,
      ),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_TTL'),
    };
  }

  async authenticateClient(
    platformId: number,
    clientSecret: string,
  ): Promise<apiResponses.ClientAuthenticateResponseEntity> {
    const platform = await this.platformService.findOne(platformId);

    if (platform.clientSecret === null)
      throw new exceptions.NullClientSecretException();
    if (platform.clientSecret !== clientSecret)
      throw new exceptions.UnauthorizedClientException();

    const payload = plainToClass(JWTClientCredentialPayload, {
      platformId,
    });

    return {
      accessToken: await this.jwtService.signAsync(classToPlain(payload), {
        secret: this.configService.get('JWT_SECRET_KEY'),
        expiresIn: this.configService.get('JWT_CLIENT_ACCESS_TOKEN_TTL'),
      }),
      expiresIn: this.configService.get('JWT_CLIENT_ACCESS_TOKEN_TTL'),
      platformId,
    };
  }
  private async createAccessTokenFromRefreshToken({
    encodedRefreshToken,
    platformId,
    revokeExistingToken,
    deleteExistingToken,
  }: {
    encodedRefreshToken: string;
    platformId: number;
    revokeExistingToken?: boolean;
    deleteExistingToken?: boolean;
  }) {
    const {
      user,
      roles,
      token: refreshToken,
    } = await this.resolveRefreshToken(encodedRefreshToken, platformId);

    const token = await this.generateAccessToken(user, platformId, roles);

    if (!!revokeExistingToken) {
      // For refresh token reuse detection
      await this.prismaService.refreshToken.update({
        where: { id: refreshToken.id },
        data: { isRevoked: true },
      });
    }

    if (!!deleteExistingToken) {
      await this.prismaService.refreshToken.delete({
        where: { id: refreshToken.id },
      });
    }

    return { user, token, roles };
  }

  private async generateAccessToken(
    user: User,
    platformId?: number,
    roles?: UserRole[],
  ) {
    const payload = plainToClass(JWTPayload, {
      username: user.username,
      userId: user.id,
      platformId,
      roles,
    });

    return this.jwtService.signAsync(classToPlain(payload), {
      secret: this.configService.get('JWT_SECRET_KEY'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_TTL'),
    });
  }

  private async generateRefreshToken(
    user: User,
    expiresIn: number,
    platformId: number,
    roles?: UserRole[],
  ) {
    const token = await this.createRefreshToken(user, expiresIn, platformId);
    const payload = plainToClass(JWTRefreshPayload, {
      tokenId: token.id,
      userId: user.id,
      platformId,
      roles,
    });

    return this.jwtService.signAsync(classToPlain(payload), {
      expiresIn,
      secret: this.configService.get('JWT_SECRET_KEY'),
    });
  }

  private async createRefreshToken(
    user: User,
    ttl: number,
    platformId: number,
  ) {
    const expiration = new Date();
    expiration.setTime(expiration.getTime() + ttl * 1000);

    return this.prismaService.refreshToken.create({
      data: {
        userId: user.id,
        isRevoked: false,
        expires: expiration,
        ...(platformId && {
          platformUserId: (
            await this.platformService.findOnePlatformUser(platformId, user.id)
          ).id,
        }),
      },
    });
  }

  private async findTokenById(id: number) {
    return this.prismaService.refreshToken.findUnique({
      where: { id },
      include: { user: true, platformUser: true },
    });
  }

  public async resolveRefreshToken(encoded: string, platformId: number) {
    const payload = await this.decodeRefreshToken(encoded);

    if (payload.tokenType === TokenType.Access) {
      throw new exceptions.InvalidTokenException(
        'Access token used in place of refresh token, please try again.',
      );
    }

    const token = await this.findStoredTokenFromRefreshTokenPayload(payload);
    if (!token) {
      throw new exceptions.InvalidTokenException('Refresh token not found');
    }

    if (token.isRevoked) {
      // Revokes all existing tokens for this platform and user
      await this.prismaService.refreshToken.updateMany({
        where: {
          userId: token.user.id,
          platformUserId: token.platformUser.id || null,
        },
        data: { isRevoked: true },
      });

      throw new exceptions.InvalidTokenException('Refresh token revoked');
    }

    const user = await this.findUserFromRefreshTokenPayload(payload);

    if (!user) {
      throw new exceptions.InvalidTokenException('Refresh token malformed');
    }

    if (payload.platformId !== platformId) {
      throw new exceptions.InvalidTokenException('Invalid token for platform');
    }

    return { user, token, platformId, roles: payload.roles };
  }

  private async decodeRefreshToken(token: string): Promise<JWTRefreshPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      if (error instanceof TokenExpiredError)
        throw new exceptions.InvalidTokenException('Refresh token expired');

      throw new exceptions.InvalidTokenException();
    }
  }

  private async findUserFromRefreshTokenPayload(payload: JWTRefreshPayload) {
    const userId = payload.userId;

    if (!userId) {
      throw new exceptions.InvalidTokenException('Refresh token malformed');
    }

    return this.usersService.findOne(userId);
  }

  private async findStoredTokenFromRefreshTokenPayload(
    payload: JWTRefreshPayload,
  ) {
    const tokenId = payload.tokenId;

    if (!tokenId) {
      throw new exceptions.InvalidTokenException('Refresh token malformed');
    }

    return this.findTokenById(tokenId);
  }
}
