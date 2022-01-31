import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { classToPlain } from 'class-transformer';
import { Repository } from 'typeorm';
import { TokenExpiredError } from 'jsonwebtoken';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { UserRole } from 'src/roles/role.enum';

import { JWTPayload } from './entities/jwt-payload.entity';
import { JWTRefreshPayload } from './entities/jwt-refresh-payload.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenType } from './enums/token-type.enum';
import { InvalidTokenException, UserNotVerifiedException } from './exceptions';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private usersService: UsersService,
    private platformService: PlatformsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && (await bcrypt.compare(pass, user.hashedPassword))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    await this.refreshTokenRepository.delete({ user, platformUser: null });
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

  async loginWithPlatform(user: User, platformId: number) {
    const platformUser = await this.platformService.findOnePlatformUser(
      platformId,
      user.id,
    );
    const platform = await this.platformService.findOne(platformId);

    if (!user.isActive) {
      throw new UserNotVerifiedException();
    }

    await this.refreshTokenRepository.delete({ user, platformUser });
    return {
      accessToken: await this.generateAccessToken(
        user,
        platformId,
        platformUser.roles,
        platform.hostUrl,
      ),
      refreshToken: await this.generateRefreshToken(
        user,
        this.configService.get('JWT_REFRESH_TOKEN_TTL'),
        platformId,
        platformUser.roles,
      ),
      platformId,
      roles: platformUser.roles,
    };
  }

  async refresh(encodedRefreshToken: string) {
    const { token } = await this.createAccessTokenFromRefreshToken(
      encodedRefreshToken,
    );
    return { accessToken: token };
  }

  async refreshWithPlatform(encodedRefreshToken: string, platformId: number) {
    const { token, roles } = await this.createAccessTokenFromRefreshToken(
      encodedRefreshToken,
      platformId,
    );
    return { accessToken: token, platformId, roles };
  }

  private async createAccessTokenFromRefreshToken(
    encodedRefreshToken: string,
    platformId?: number,
  ) {
    const { user, roles } = await this.resolveRefreshToken(
      encodedRefreshToken,
      platformId,
    );

    const token = await this.generateAccessToken(user, platformId, roles);

    return { user, token, roles };
  }

  private async generateAccessToken(
    user: User,
    platformId?: number,
    roles?: UserRole[],
    hostUrl?: string,
  ) {
    const payload = new JWTPayload({
      username: user.username,
      userId: user.id,
      audienceUrl: hostUrl || this.configService.get('HOST_URL'),
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
    expiration.setTime(expiration.getTime() + ttl);

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
    return this.refreshTokenRepository.findOne(id);
  }

  public async resolveRefreshToken(encoded: string, platformId?: number) {
    const payload = await this.decodeRefreshToken(encoded);

    if (payload.tokenType === TokenType.ACCESS) {
      throw new InvalidTokenException(
        'Access token used in place of refresh token, please try again.',
      );
    }

    const token = await this.getStoredTokenFromRefreshTokenPayload(payload);
    if (!token) {
      throw new InvalidTokenException('Refresh token not found');
    }

    if (token.isRevoked) {
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
