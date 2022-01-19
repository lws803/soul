import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { TokenExpiredError } from 'jsonwebtoken';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';

import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let refreshTokenRepository: Repository<RefreshToken>;

  beforeEach(async () => {
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
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('SIGNED_TOKEN'),
            verifyAsync: jest
              .fn()
              .mockResolvedValue(factories.jwtRefreshPayload.build()),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        user,
        platformUser: null,
      });

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
      });
    });
  });

  describe('loginWithPlatform()', () => {
    it('should generate access and refresh token on successful login', async () => {
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();

      const response = await service.loginWithPlatform(
        user,
        platformUser.platform.id,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        factories.jwtPayloadWithPlatform.build({
          audienceUrl: 'TEST_HOST_URL',
        }),
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

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        user,
        platformUser: platformUser,
      });

      expect(response).toEqual({
        accessToken: 'SIGNED_TOKEN',
        refreshToken: 'SIGNED_TOKEN',
        platformId: platformUser.platform.id,
        roles: platformUser.roles,
      });
    });
  });

  describe('refresh()', () => {
    it('should refresh successfully with valid refresh token', async () => {
      const response = await service.refresh('REFRESH_TOKEN');

      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith(
        factories.refreshToken.build().id,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtPayload.build(),
        { secret: 'JWT_SECRET_KEY' },
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
      });
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
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        factories.jwtPayloadWithPlatform.build(),
        { secret: 'JWT_SECRET_KEY' },
      );

      expect(response).toStrictEqual({
        accessToken: 'SIGNED_TOKEN',
        platformId: platformUser.platform.id,
        roles: platformUser.roles,
      });
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
  });
});