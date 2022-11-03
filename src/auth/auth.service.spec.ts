import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenExpiredError } from 'jsonwebtoken';
import { CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import * as factories from 'factories';
import { UserRole } from 'src/roles/role.enum';
import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { AuthService } from './auth.service';
import {
  InvalidCodeException,
  NullClientSecretException,
  PKCENotMatchException,
  UnauthorizedClientException,
} from './exceptions';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let configService: ConfigService;
  let platformsService: PlatformsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.userEntity.build()),
            findOneByEmail: jest
              .fn()
              .mockResolvedValue(factories.userEntity.build()),
          },
        },
        {
          provide: PlatformsService,
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.platformEntity.build()),
            findOnePlatformUser: jest
              .fn()
              .mockResolvedValue(factories.platformUserEntity.build()),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((arg) => {
              if (arg === 'JWT_REFRESH_TOKEN_TTL') return 3600;
              if (arg === 'HOST_URL') return 'localhost:3000';
              if (arg === 'REFRESH_TOKEN_ROTATION') return false;
              return arg;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findUnique: jest
                .fn()
                .mockResolvedValue(factories.refreshTokenEntity.build()),
              create: jest
                .fn()
                .mockResolvedValue(factories.refreshTokenEntity.build()),
              delete: jest.fn(),
              update: jest
                .fn()
                .mockResolvedValue(factories.refreshTokenEntity.build()),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('SIGNED_TOKEN'),
            verifyAsync: jest
              .fn()
              .mockResolvedValue(factories.jwtRefreshPayload.build()),
            sign: jest.fn().mockReturnValue('SIGNED_TOKEN'),
            verify: jest.fn().mockReturnValue({
              userId: factories.userEntity.build().id,
              platformId: factories.platformEntity.build().id,
              callback: 'TEST_REDIRECT_URI',
              codeChallengeKey: 'CODE_CHALLENGE_KEY',
            }),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
            get: jest
              .fn()
              .mockResolvedValue(
                base64url(sha256('CODE_VERIFIER').toString(), 'hex'),
              ),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    configService = module.get<ConfigService>(ConfigService);
    platformsService = module.get<PlatformsService>(PlatformsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('validateUser()', () => {
    it('should return user if email and password are valid', async () => {
      const bycryptCompare = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      const response = await service.validateUser('EMAIL', 'PASSWORD');

      expect(bycryptCompare).toHaveBeenCalledWith(
        'PASSWORD',
        'TEST_HASHED_PASSWORD',
      );

      expect(response).toStrictEqual(factories.userEntity.build());
    });

    it('should return null if email and password are invalid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(null));
      const response = await service.validateUser('EMAIL', 'PASSWORD');

      expect(response).toBeNull();
    });
  });

  describe('login()', () => {
    it('should generate access token only on successful login', async () => {
      const user = factories.userEntity.build();
      const response = await service.login(user);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtPayload.build(),
        { secret: 'JWT_SECRET_KEY', expiresIn: 'JWT_ACCESS_TOKEN_TTL' },
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        expiresIn: 'JWT_ACCESS_TOKEN_TTL',
      });
    });
  });

  describe('getCodeForPlatformAndCallback()', () => {
    it('should generate access and refresh token on successful login', async () => {
      const user = factories.userEntity.build();
      const platformUser = factories.platformUserEntity.build();
      const codeChallenge = 'CODE_CHALLENGE';

      const response = await service.findCodeForPlatformAndCallback({
        user,
        platformId: platformUser.platformId,
        callback: 'TEST_REDIRECT_URI',
        state: 'TEST_STATE',
        codeChallenge,
      });

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('REDIS_DB_KEY_PREFIX:'),
        codeChallenge,
        { ttl: 'PKCE_CODE_CHALLENGE_TTL' },
      );

      expect(response).toEqual({ code: 'SIGNED_TOKEN', state: 'TEST_STATE' });
    });

    it('denies access when callback uri is not registered', async () => {
      const user = factories.userEntity.build();
      const platformUser = factories.platformUserEntity.build();

      await expect(
        service.findCodeForPlatformAndCallback({
          user,
          platformId: platformUser.platformId,
          callback: 'INVALID_URI',
          state: 'TEST_STATE',
          codeChallenge: 'CODE_CHALLENGE',
        }),
      ).rejects.toThrow('Invalid redirect uri supplied');
    });

    it('denies access to inactive users', async () => {
      const user = factories.userEntity.build({ isActive: false });
      const platformUser = factories.platformUserEntity.build();

      await expect(
        service.findCodeForPlatformAndCallback({
          user,
          platformId: platformUser.platformId,
          callback: 'TEST_REDIRECT_URI',
          state: 'TEST_STATE',
          codeChallenge: 'CODE_CHALLENGE',
        }),
      ).rejects.toThrow(
        'User is not verified, please verify your email address.',
      );
    });
  });

  describe('exchangeCodeForToken()', () => {
    it('exchanges code for accessToken and refreshToken', async () => {
      const code = 'SIGNED_TOKEN';
      const response = await service.exchangeCodeForToken({
        code,
        callback: 'TEST_REDIRECT_URI',
        codeVerifier: 'CODE_VERIFIER',
      });
      const user = factories.userEntity.build();
      const platformUser = factories.platformUserEntity.build();

      expect(jwtService.verify).toHaveBeenCalledWith(code);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        factories.jwtPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY', expiresIn: 'JWT_ACCESS_TOKEN_TTL' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        factories.jwtRefreshPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY', expiresIn: 3600 },
      );

      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          isRevoked: false,
          expires: expect.any(Date),
          platformUserId: platformUser.id,
        },
      });

      const redisKey = 'REDIS_DB_KEY_PREFIX:CODE_CHALLENGE_KEY';
      expect(cacheManager.get).toHaveBeenCalledWith(redisKey);
      expect(cacheManager.del).toHaveBeenCalledWith(redisKey);

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
        platformId: 1,
        roles: [UserRole.Admin, UserRole.Member],
        expiresIn: 'JWT_ACCESS_TOKEN_TTL',
      });
    });

    it('denies access when callback uri is not the same as initially provided', async () => {
      const code = 'SIGNED_TOKEN';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => ({
        userId: 1,
        platformId: 1,
        callback: 'INVALID_URI',
      }));
      await expect(
        service.exchangeCodeForToken({
          code,
          callback: 'TEST_REDIRECT_URI',
          codeVerifier: 'CODE_VERIFIER',
        }),
      ).rejects.toThrow('Invalid redirect uri supplied');
    });

    it('throws error when PKCE mismatch', async () => {
      jest
        .spyOn(cacheManager, 'get')
        .mockResolvedValue('DIFFERENT_CODE_CHALLENGE');

      const code = 'SIGNED_TOKEN';
      await expect(
        service.exchangeCodeForToken({
          code,
          callback: 'TEST_REDIRECT_URI',
          codeVerifier: 'CODE_VERIFIER',
        }),
      ).rejects.toThrow(new PKCENotMatchException());
    });

    it('throws error when code has expired or malformed', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid error');
      });

      const code = 'SIGNED_TOKEN';
      await expect(
        service.exchangeCodeForToken({
          code,
          callback: 'TEST_REDIRECT_URI',
          codeVerifier: 'CODE_VERIFIER',
        }),
      ).rejects.toThrow(new InvalidCodeException());
    });
  });

  describe('refreshWithPlatform()', () => {
    it('should refresh successfully with valid refresh token', async () => {
      const platformUser = factories.platformUserEntity.build();
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.resolve(factories.jwtRefreshPayloadWithPlatform.build()),
        );
      const response = await service.refreshWithPlatform(
        'REFRESH_TOKEN',
        platformUser.platformId,
      );

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        include: { platformUser: true, user: true },
        where: { id: factories.refreshTokenEntity.build().id },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY', expiresIn: 'JWT_ACCESS_TOKEN_TTL' },
      );
      expect(prismaService.refreshToken.update).not.toHaveBeenCalledWith(
        factories.refreshTokenEntity.build().id,
        { isRevoked: true },
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
        platformId: platformUser.platformId,
        roles: platformUser.roles,
        expiresIn: 'JWT_ACCESS_TOKEN_TTL',
      });
    });

    it('should revoke previous token if REFRESH_TOKEN_ROTATION is true', async () => {
      jest.spyOn(configService, 'get').mockImplementation((arg) => {
        if (arg === 'JWT_REFRESH_TOKEN_TTL') return 3600;
        if (arg === 'HOST_URL') return 'localhost:3000';
        if (arg === 'REFRESH_TOKEN_ROTATION') return true;
      });

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.resolve(factories.jwtRefreshPayloadWithPlatform.build()),
        );

      const platformUser = factories.platformUserEntity.build();

      await service.refreshWithPlatform(
        'REFRESH_TOKEN',
        platformUser.platformId,
      );
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        data: { isRevoked: true },
        where: { id: factories.refreshTokenEntity.build().id },
      });
    });

    it('should throw when refresh token does not exist', async () => {
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(null);
      const platformUser = factories.platformUserEntity.build();

      await expect(
        service.refreshWithPlatform('REFRESH_TOKEN', platformUser.platformId),
      ).rejects.toThrow('Refresh token not found');
    });

    it('should throw when refresh token expired', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.reject(new TokenExpiredError('expired token', new Date())),
        );
      const platformUser = factories.platformUserEntity.build();

      await expect(
        service.refreshWithPlatform('REFRESH_TOKEN', platformUser.platformId),
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw when refresh token is revoked, and revokes all existing tokens', async () => {
      const revokedRefreshToken = factories.refreshTokenEntity.build({
        isRevoked: true,
      });
      jest
        .spyOn(prismaService.refreshToken, 'findUnique')
        .mockResolvedValue(revokedRefreshToken);

      const platformUser = factories.platformUserEntity.build();

      await expect(
        service.refreshWithPlatform('REFRESH_TOKEN', platformUser.platformId),
      ).rejects.toThrow('Refresh token revoked');

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          platformUserId: revokedRefreshToken.platformUserId,
          userId: revokedRefreshToken.userId,
        },
        data: { isRevoked: true },
      });
    });

    it('should revoke previous token if REFRESH_TOKEN_ROTATION is true', async () => {
      jest.spyOn(configService, 'get').mockImplementation((arg) => {
        if (arg === 'JWT_REFRESH_TOKEN_TTL') return 3600;
        if (arg === 'HOST_URL') return 'localhost:3000';
        if (arg === 'REFRESH_TOKEN_ROTATION') return true;
      });

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.resolve(factories.jwtRefreshPayloadWithPlatform.build()),
        );

      const platformUser = factories.platformUserEntity.build();

      await service.refreshWithPlatform(
        'REFRESH_TOKEN',
        platformUser.platformId,
      );

      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        data: { isRevoked: true },
        where: { id: factories.refreshTokenEntity.build().id },
      });

      expect(prismaService.refreshToken.delete).not.toHaveBeenCalled();
    });

    it('should delete previous token if REFRESH_TOKEN_ROTATION is false', async () => {
      jest.spyOn(configService, 'get').mockImplementation((arg) => {
        if (arg === 'JWT_REFRESH_TOKEN_TTL') return 3600;
        if (arg === 'HOST_URL') return 'localhost:3000';
        if (arg === 'REFRESH_TOKEN_ROTATION') return false;
      });

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.resolve(factories.jwtRefreshPayloadWithPlatform.build()),
        );

      const platformUser = factories.platformUserEntity.build();

      await service.refreshWithPlatform(
        'REFRESH_TOKEN',
        platformUser.platformId,
      );

      expect(prismaService.refreshToken.update).not.toHaveBeenCalled();
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: factories.refreshTokenEntity.build().id },
      });
    });
  });

  describe('authenticateClient()', () => {
    it('should authenticate clients and generate access token successfully', async () => {
      const platform = factories.platformEntity.build({
        clientSecret: 'CLIENT_SECRET',
      });
      jest.spyOn(platformsService, 'findOne').mockResolvedValue(platform);

      const response = await service.authenticateClient(
        platform.id,
        platform.clientSecret,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtClientCredentialPayload.build({ platformId: platform.id }),
        { secret: 'JWT_SECRET_KEY', expiresIn: 'JWT_CLIENT_ACCESS_TOKEN_TTL' },
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        expiresIn: 'JWT_CLIENT_ACCESS_TOKEN_TTL',
        platformId: platform.id,
      });
    });

    it('should throw when platform does not have client secret set', async () => {
      const platform = factories.platformEntity.build({
        clientSecret: null,
      });
      jest.spyOn(platformsService, 'findOne').mockResolvedValue(platform);

      expect(
        service.authenticateClient(platform.id, platform.clientSecret),
      ).rejects.toThrow(new NullClientSecretException());

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw when client secret does not match', async () => {
      const platform = factories.platformEntity.build({
        clientSecret: 'CLIENT_SECRET',
      });
      jest.spyOn(platformsService, 'findOne').mockResolvedValue(platform);

      expect(
        service.authenticateClient(platform.id, 'WRONG_SECRET'),
      ).rejects.toThrow(new UnauthorizedClientException());

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
