import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import { User } from 'src/users/entities/user.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';
import { TasksService } from 'src/tasks/tasks.service';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import { createUsersAndLoginFixture } from './fixtures/create-users-and-login-fixture';

describe('TasksModule (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;
  let platformCategoryRepository: Repository<PlatformCategory>;
  let tasksService: TasksService;

  const codeVerifier = 'CODE_VERIFIER';
  const codeChallenge = base64url(sha256(codeVerifier).toString(), 'hex');

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    const connection = app.get(Connection);
    await connection.synchronize(true);

    tasksService = app.get<TasksService>(TasksService);

    userRepository = connection.getRepository(User);
    refreshTokenRepository = connection.getRepository(RefreshToken);
    platformUserRepository = connection.getRepository(PlatformUser);
    platformRepository = connection.getRepository(Platform);
    platformCategoryRepository = connection.getRepository(PlatformCategory);

    await platformCategoryRepository.save(
      factories.platformCategoryEntity.build(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('cleanupExpiredRefreshTokens', () => {
    let userAccount: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    beforeAll(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;

      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.platformUserEntity.build({
          platform,
          user: userAccount.user,
        }),
      );
    });

    afterAll(async () => {
      await refreshTokenRepository.delete({});
      await platformUserRepository.delete({});
      await platformRepository.delete({});
      await userRepository.delete({});
    });

    it('clears tokens for platforms exceeding 10', async () => {
      const platformId = 1;

      const params = new URLSearchParams({
        code_challenge: codeChallenge,
        state: 'TEST_STATE',
        redirect_uri: 'https://www.example.com',
        client_id: String(platformId),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const resp = await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      const { refresh_token } = resp.body;

      await request(app.getHttpServer())
        .post('/auth/oauth/refresh-token')
        .send({ refresh_token, client_id: platformId })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.headers['cache-control']).toBe('no-store');
          expect(res.body).toEqual({
            access_token: expect.any(String),
            refresh_token: expect.any(String),
            expires_in: 900,
            platform_id: 1,
            roles: ['admin', 'member'],
          });
        });

      for (let i = 0; i < 10; i++) {
        const params = new URLSearchParams({
          code_challenge: codeChallenge,
          state: 'TEST_STATE',
          redirect_uri: 'https://www.example.com',
          client_id: String(platformId),
        });
        const codeResp = await request(app.getHttpServer())
          .post(`/auth/code?${params.toString()}`)
          .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
        const resp = await request(app.getHttpServer())
          .post('/auth/oauth/authorization-code')
          .send({
            code: codeResp.body.code,
            redirect_uri: 'https://www.example.com',
            code_verifier: codeVerifier,
          });

        const { refresh_token } = resp.body;
        const refreshResp = await request(app.getHttpServer())
          .post('/auth/oauth/refresh-token')
          .send({ refresh_token, client_id: 1 });
        expect(refreshResp.status).toBe(HttpStatus.OK);
      }

      const platformUser = await platformUserRepository
        .createQueryBuilder('platform_user')
        .where('user_id = :userId', {
          userId: userAccount.user.id,
        })
        .andWhere('platform_id = :platformId', { platformId })
        .getOne();

      expect(
        await refreshTokenRepository.count({ platformUser: platformUser }),
      ).toEqual(11);

      expect(
        await platformUserRepository
          .createQueryBuilder('platform_user')
          .where('user_id = :userId', {
            userId: userAccount.user.id,
          })
          .andWhere('platform_id IS NULL')
          .getOne(),
      ).not.toBeNull();

      await tasksService.cleanupExpiredRefreshTokens();

      // Other platform refresh tokens should not be affected
      expect(
        await platformUserRepository
          .createQueryBuilder('platform_user')
          .where('user_id = :userId', {
            userId: userAccount.user.id,
          })
          .andWhere('platform_id IS NULL')
          .getOne(),
      ).not.toBeNull();

      // Only the one with count above 10 should be deleted
      expect(
        await refreshTokenRepository.count({ platformUser: platformUser }),
      ).toEqual(0);
    });
  });
});
