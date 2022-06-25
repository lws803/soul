import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { TokenExpiredError } from 'jsonwebtoken';
import { CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import * as factories from 'factories';
import { UserRole } from 'src/roles/role.enum';
import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';

import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { InvalidCodeException, PKCENotMatchException } from './exceptions';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let refreshTokenRepository: Repository<RefreshToken>;
  let refreshTokenCreateQueryBuilder: any;
  let cacheManager: Cache;
  let configService: ConfigService;

  beforeEach(async () => {
    refreshTokenCreateQueryBuilder = {
      delete: jest
        .fn()
        .mockImplementation(() => refreshTokenCreateQueryBuilder),
      where: jest.fn().mockImplementation(() => refreshTokenCreateQueryBuilder),
      andWhere: jest
        .fn()
        .mockImplementation(() => refreshTokenCreateQueryBuilder),
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
            findOneByEmail: jest
              .fn()
              .mockResolvedValue(factories.oneUser.build()),
          },
        },
        {
          provide: PlatformsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            findOnePlatformUser: jest
              .fn()
              .mockResolvedValue(factories.onePlatformUser.build()),
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
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.refreshToken.build()),
            save: jest.fn().mockResolvedValue(factories.refreshToken.build()),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => refreshTokenCreateQueryBuilder),
            update: jest.fn().mockResolvedValue(factories.refreshToken.build()),
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
              userId: factories.oneUser.build().id,
              platformId: factories.onePlatform.build().id,
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
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    configService = module.get<ConfigService>(ConfigService);
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

      expect(response).toStrictEqual(factories.oneUser.build());
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
    it('should generate access and refresh token on successful login', async () => {
      const user = factories.oneUser.build();
      const response = await service.login(user);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        factories.jwtPayload.build(),
        { secret: 'JWT_SECRET_KEY' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        factories.jwtRefreshPayload.build(),
        { secret: 'JWT_SECRET_KEY', expiresIn: 3600 },
      );

      expect(refreshTokenRepository.save).toHaveBeenCalledWith({
        user: user,
        isRevoked: false,
        expires: expect.any(Date),
      });

      expect(refreshTokenRepository.createQueryBuilder).toHaveBeenCalled();
      expect(refreshTokenCreateQueryBuilder.where).toHaveBeenCalledWith(
        'refresh_tokens.expires <= :currentDate',
        { currentDate: expect.any(Date) },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'refresh_tokens.user_id = :userId',
        { userId: 1 },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'refresh_tokens.platform_user_id is NULL',
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
        expiresIn: 'JWT_ACCESS_TOKEN_TTL',
      });
    });
  });

  describe('getCodeForPlatformAndCallback()', () => {
    it('should generate access and refresh token on successful login', async () => {
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();
      const codeChallenge = 'CODE_CHALLENGE';

      const response = await service.findCodeForPlatformAndCallback({
        user,
        platformId: platformUser.platform.id,
        callback: 'TEST_REDIRECT_URI',
        state: 'TEST_STATE',
        codeChallenge,
      });

      expect(refreshTokenRepository.createQueryBuilder).toHaveBeenCalled();
      expect(refreshTokenCreateQueryBuilder.where).toHaveBeenCalledWith(
        'refresh_tokens.expires <= :currentDate',
        { currentDate: expect.any(Date) },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'refresh_tokens.user_id = :userId',
        { userId: 1 },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'refresh_tokens.platform_user_id = :platformUserId',
        { platformUserId: 1 },
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('REDIS_DB_KEY_PREFIX:'),
        codeChallenge,
        { ttl: 'PKCE_CODE_CHALLENGE_TTL' },
      );

      expect(response).toEqual({ code: 'SIGNED_TOKEN', state: 'TEST_STATE' });
    });

    it('denies access when callback uri is not registered', async () => {
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();

      await expect(
        service.findCodeForPlatformAndCallback({
          user,
          platformId: platformUser.platform.id,
          callback: 'INVALID_URI',
          state: 'TEST_STATE',
          codeChallenge: 'CODE_CHALLENGE',
        }),
      ).rejects.toThrow('Invalid redirect uri supplied');
    });

    it('denies access to inactive users', async () => {
      const user = factories.oneUser.build({ isActive: false });
      const platformUser = factories.onePlatformUser.build();

      await expect(
        service.findCodeForPlatformAndCallback({
          user,
          platformId: platformUser.platform.id,
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
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();

      expect(jwtService.verify).toHaveBeenCalledWith(code);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        factories.jwtPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        factories.jwtRefreshPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY', expiresIn: 3600 },
      );

      expect(refreshTokenRepository.save).toHaveBeenCalledWith({
        user: user,
        isRevoked: false,
        expires: expect.any(Date),
        platformUser: platformUser,
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

  describe('refresh()', () => {
    it('should refresh successfully with valid refresh token', async () => {
      const response = await service.refresh('REFRESH_TOKEN');

      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith(
        factories.refreshToken.build().id,
        { relations: ['user', 'platformUser'] },
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtPayload.build(),
        { secret: 'JWT_SECRET_KEY' },
      );

      expect(refreshTokenRepository.update).not.toHaveBeenCalledWith(
        factories.refreshToken.build().id,
        { isRevoked: true },
      );

      // Should also delete expired tokens
      expect(refreshTokenRepository.createQueryBuilder).toHaveBeenCalled();
      expect(refreshTokenCreateQueryBuilder.where).toHaveBeenCalledWith(
        'refresh_tokens.expires <= :currentDate',
        { currentDate: expect.any(Date) },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'refresh_tokens.user_id = :userId',
        { userId: 1 },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'refresh_tokens.platform_user_id is NULL',
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
        expiresIn: 'JWT_ACCESS_TOKEN_TTL',
      });
    });

    it('should revoke previous token if REFRESH_TOKEN_ROTATION is true', async () => {
      jest.spyOn(configService, 'get').mockImplementation((arg) => {
        if (arg === 'JWT_REFRESH_TOKEN_TTL') return 3600;
        if (arg === 'HOST_URL') return 'localhost:3000';
        if (arg === 'REFRESH_TOKEN_ROTATION') return true;
      });
      await service.refresh('REFRESH_TOKEN');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        factories.refreshToken.build().id,
        { isRevoked: true },
      );
    });

    it('should throw when refresh token does not exist', async () => {
      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockImplementation(() => Promise.resolve(null));

      await expect(service.refresh('REFRESH_TOKEN')).rejects.toThrow(
        'Refresh token not found',
      );
    });

    it('should throw when refresh token expired', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.reject(new TokenExpiredError('expired token', new Date())),
        );

      await expect(service.refresh('REFRESH_TOKEN')).rejects.toThrow(
        'Refresh token expired',
      );
    });

    it('should throw when refresh token is revoked, and revokes all existing tokens', async () => {
      const revokedRefreshToken = factories.refreshToken.build({
        isRevoked: true,
        platformUser: undefined,
      });
      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockResolvedValue(revokedRefreshToken);

      await expect(service.refresh('REFRESH_TOKEN')).rejects.toThrow(
        'Refresh token revoked',
      );
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        {
          platformUser: null,
          user: revokedRefreshToken.user,
        },
        { isRevoked: true },
      );
    });
  });

  describe('refreshWithPlatform()', () => {
    it('should refresh successfully with valid refresh token', async () => {
      const platformUser = factories.onePlatformUser.build();
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.resolve(factories.jwtRefreshPayloadWithPlatform.build()),
        );
      const response = await service.refreshWithPlatform(
        'REFRESH_TOKEN',
        platformUser.platform.id,
      );

      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith(
        factories.refreshToken.build().id,
        { relations: ['user', 'platformUser'] },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY' },
      );
      expect(refreshTokenRepository.update).not.toHaveBeenCalledWith(
        factories.refreshToken.build().id,
        { isRevoked: true },
      );

      // Should also delete expired tokens
      expect(refreshTokenRepository.createQueryBuilder).toHaveBeenCalled();
      expect(refreshTokenCreateQueryBuilder.where).toHaveBeenCalledWith(
        'refresh_tokens.expires <= :currentDate',
        { currentDate: expect.any(Date) },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'refresh_tokens.user_id = :userId',
        { userId: 1 },
      );
      expect(refreshTokenCreateQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'refresh_tokens.platform_user_id = :platformUserId',
        { platformUserId: 1 },
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
        platformId: platformUser.platform.id,
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

      const platformUser = factories.onePlatformUser.build();

      await service.refreshWithPlatform(
        'REFRESH_TOKEN',
        platformUser.platform.id,
      );
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        factories.refreshToken.build().id,
        { isRevoked: true },
      );
    });

    it('should throw when refresh token does not exist', async () => {
      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockImplementation(() => Promise.resolve(null));
      const platformUser = factories.onePlatformUser.build();

      await expect(
        service.refreshWithPlatform('REFRESH_TOKEN', platformUser.platform.id),
      ).rejects.toThrow('Refresh token not found');
    });

    it('should throw when refresh token expired', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockImplementation(() =>
          Promise.reject(new TokenExpiredError('expired token', new Date())),
        );
      const platformUser = factories.onePlatformUser.build();

      await expect(
        service.refreshWithPlatform('REFRESH_TOKEN', platformUser.platform.id),
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw when refresh token is revoked, and revokes all existing tokens', async () => {
      const revokedRefreshToken = factories.refreshToken.build({
        isRevoked: true,
      });
      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockResolvedValue(revokedRefreshToken);

      await expect(service.refresh('REFRESH_TOKEN')).rejects.toThrow(
        'Refresh token revoked',
      );
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        {
          platformUser: revokedRefreshToken.platformUser,
          user: revokedRefreshToken.user,
        },
        { isRevoked: true },
      );
    });
  });
});
