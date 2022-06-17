import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { classToPlain } from 'class-transformer';
import { Repository } from 'typeorm';
import { TokenExpiredError } from 'jsonwebtoken';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import * as sha256 from 'crypto-js/sha256';
import { captureMessage } from '@sentry/node';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UserRole } from 'src/roles/role.enum';

import { JWTPayload } from './entities/jwt-payload.entity';
import { JWTRefreshPayload } from './entities/jwt-refresh-payload.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenType } from './enums/token-type.enum';
import {
  InvalidTokenException,
  UserNotVerifiedException,
  InvalidCallbackException,
  PKCENotMatchException,
  InvalidCodeException,
} from './exceptions';
import {
  CodeResponseDto,
  RefreshTokenResponseDto,
  RefreshTokenWithPlatformResponseDto,
} from './dto/api-responses.dto';
import { CodeQueryParamDto, ValidateQueryParamDto } from './dto/api.dto';
import { DecodedCode } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private usersService: UsersService,
    private platformService: PlatformsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && (await bcrypt.compare(pass, user.hashedPassword))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    await this.refreshTokenRepository
      .createQueryBuilder('refresh_tokens')
      .delete()
      .where('refresh_tokens.expires <= :currentDate', {
        currentDate: new Date(),
      })
      .andWhere('refresh_tokens.user_id = :userId', { userId: user.id })
      .andWhere('refresh_tokens.platform_user_id is NULL')
      .execute();

    if (!user.isActive) {
      throw new UserNotVerifiedException();
    }

    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(
        user,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
      ),
    };
  }

  async getCodeForPlatformAndCallback({
    user,
    platformId,
    callback,
    state,
    codeChallenge,
  }: {
    user: User;
  } & CodeQueryParamDto): Promise<CodeResponseDto> {
    if (!user.isActive) {
      throw new UserNotVerifiedException();
    }

    const platformUser = await this.platformService.findOnePlatformUser(
      platformId,
      user.id,
    );

    const platform = await this.platformService.findOne(platformId);

    if (!platform.redirectUris.includes(callback)) {
      throw new InvalidCallbackException();
    }

    await this.refreshTokenRepository
      .createQueryBuilder('refresh_tokens')
      .delete()
      .where('refresh_tokens.expires <= :currentDate', {
        currentDate: new Date(),
      })
      .andWhere('refresh_tokens.user_id = :userId', { userId: user.id })
      .andWhere('refresh_tokens.platform_user_id = :platformUserId', {
        platformUserId: platformUser.id,
      })
      .execute();

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
  }: ValidateQueryParamDto) {
    let decodedToken: DecodedCode;
    try {
      decodedToken = this.jwtService.verify<DecodedCode>(code);
    } catch (Error) {
      throw new InvalidCodeException();
    }

    if (decodedToken.callback !== callback) {
      throw new InvalidCallbackException();
    }

    const challengeCode = await this.cacheManager.get(
      `${this.configService.get('REDIS_DB_KEY_PREFIX')}:${
        decodedToken.codeChallengeKey
      }`,
    );
    if (challengeCode !== sha256(codeVerifier).toString()) {
      // TODO: Remove this
      captureMessage(
        `PKCENotMatchException, ${challengeCode}, ${sha256(
          codeVerifier,
        ).toString()}`,
      );
      await this.cacheManager.del(
        `${this.configService.get('REDIS_DB_KEY_PREFIX')}:${
          decodedToken.codeChallengeKey
        }`,
      );
      throw new PKCENotMatchException();
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

    return {
      accessToken: await this.generateAccessToken(
        user,
        decodedToken.platformId,
        platformUser.roles,
      ),
      refreshToken: await this.generateRefreshToken(
        user,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
        decodedToken.platformId,
        platformUser.roles,
      ),
      platformId: decodedToken.platformId,
      roles: platformUser.roles,
    };
  }

  async refresh(encodedRefreshToken: string): Promise<RefreshTokenResponseDto> {
    const { token, user } =
      await this.createAccessTokenFromRefreshTokenAndRemoveExisting(
        encodedRefreshToken,
      );
    return {
      accessToken: token,
      refreshToken: await this.generateRefreshToken(
        user,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
      ),
    };
  }

  async refreshWithPlatform(
    encodedRefreshToken: string,
    platformId: number,
  ): Promise<RefreshTokenWithPlatformResponseDto> {
    const { token, roles, user } =
      await this.createAccessTokenFromRefreshTokenAndRemoveExisting(
        encodedRefreshToken,
        platformId,
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
    };
  }

  private async createAccessTokenFromRefreshTokenAndRemoveExisting(
    encodedRefreshToken: string,
    platformId?: number,
  ) {
    const {
      user,
      roles,
      token: refreshToken,
    } = await this.resolveRefreshToken(encodedRefreshToken, platformId);

    const token = await this.generateAccessToken(user, platformId, roles);

    // For refresh token reuse detection
    await this.refreshTokenRepository.update(refreshToken.id, {
      isRevoked: true,
    });

    return { user, token, roles };
  }

  private async generateAccessToken(
    user: User,
    platformId?: number,
    roles?: UserRole[],
  ) {
    const payload = new JWTPayload({
      username: user.username,
      userId: user.id,
      platformId,
      roles,
    });

    return this.jwtService.signAsync(classToPlain(payload), {
      secret: this.configService.get('JWT_SECRET_KEY'),
    });
  }

  private async generateRefreshToken(
    user: User,
    expiresIn: number,
    platformId?: number,
    roles?: UserRole[],
  ) {
    const token = await this.createRefreshToken(user, expiresIn, platformId);
    const payload = new JWTRefreshPayload({
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
    platformId?: number,
  ) {
    const token = new RefreshToken();

    token.user = user;
    token.isRevoked = false;
    const expiration = new Date();
    expiration.setTime(expiration.getTime() + ttl * 1000);

    token.expires = expiration;
    if (platformId) {
      token.platformUser = await this.platformService.findOnePlatformUser(
        platformId,
        user.id,
      );
    }

    return this.refreshTokenRepository.save(token);
  }

  private async findTokenById(id: number) {
    return this.refreshTokenRepository.findOne(id, {
      relations: ['user', 'platformUser'],
    });
  }

  public async resolveRefreshToken(encoded: string, platformId?: number) {
    const payload = await this.decodeRefreshToken(encoded);

    if (payload.tokenType === TokenType.Access) {
      throw new InvalidTokenException(
        'Access token used in place of refresh token, please try again.',
      );
    }

    const token = await this.getStoredTokenFromRefreshTokenPayload(payload);
    if (!token) {
      throw new InvalidTokenException('Refresh token not found');
    }

    if (token.isRevoked) {
      // Revokes all existing tokens for this platform and user
      this.refreshTokenRepository.update(
        {
          user: token.user,
          platformUser: token.platformUser || null,
        },
        { isRevoked: true },
      );

      throw new InvalidTokenException('Refresh token revoked');
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);

    if (!user) {
      throw new InvalidTokenException('Refresh token malformed');
    }

    if (platformId && payload.platformId !== platformId) {
      throw new InvalidTokenException('Invalid token for platform');
    }

    if (!platformId && payload.platformId) {
      throw new InvalidTokenException(
        `Refresh token is for a platform with id: ${payload.platformId}.`,
      );
    }

    return { user, token, platformId, roles: payload.roles };
  }

  private async decodeRefreshToken(token: string): Promise<JWTRefreshPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      if (error instanceof TokenExpiredError)
        throw new InvalidTokenException('Refresh token expired');

      throw new InvalidTokenException();
    }
  }

  private async getUserFromRefreshTokenPayload(payload: JWTRefreshPayload) {
    const userId = payload.userId;

    if (!userId) {
      throw new InvalidTokenException('Refresh token malformed');
    }

    return this.usersService.findOne(userId);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: JWTRefreshPayload,
  ) {
    const tokenId = payload.tokenId;

    if (!tokenId) {
      throw new InvalidTokenException('Refresh token malformed');
    }

    return this.findTokenById(tokenId);
  }
}
