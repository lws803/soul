import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';
import { PlatformUser, User } from '@prisma/client';

import { TasksService } from 'src/tasks/tasks.service';
import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import { createUsersAndLoginFixture } from './fixtures/create-users-and-login-fixture';
import { resetDatabase } from './utils/reset-database';

describe('TasksModule (e2e)', () => {
  let app: INestApplication;
  let tasksService: TasksService;
  let prismaService: PrismaService;

  const codeVerifier = 'CODE_VERIFIER';
  const codeChallenge = base64url(sha256(codeVerifier).toString(), 'hex');

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    tasksService = app.get<TasksService>(TasksService);

    prismaService = app.get<PrismaService>(PrismaService);
    await resetDatabase();

    await prismaService.platformCategory.create({
      data: factories.platformCategoryEntity.build(),
    });
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
    let firstPlatformUser: PlatformUser;
    let secondPlatformUser: PlatformUser;

    beforeAll(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;

      const platform = await prismaService.platform.create({
        data: factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      });
      firstPlatformUser = await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          platformId: platform.id,
          userId: userAccount.user.id,
        }),
      });

      const secondPlatform = await prismaService.platform.create({
        data: factories.platformEntity.build({
          id: 2,
          name: 'test_platform_2',
          nameHandle: 'test_platform_2#2',
          redirectUris: ['https://www.example.com'],
        }),
      });
      secondPlatformUser = await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          id: 2,
          platformId: secondPlatform.id,
          userId: userAccount.user.id,
        }),
      });

      const currDate = new Date();
      currDate.setDate(currDate.getDate() + 5);
      await prismaService.refreshToken.create({
        data: factories.refreshTokenEntity.build({
          platformUserId: secondPlatformUser.id,
          userId: userAccount.user.id,
          expires: currDate,
        }),
      });
    });

    afterAll(async () => {
      await prismaService.refreshToken.deleteMany();
      await prismaService.platformUser.deleteMany();
      await prismaService.platform.deleteMany();
      await prismaService.user.deleteMany();
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

      expect(
        await prismaService.refreshToken.count({
          where: { platformUserId: firstPlatformUser.id },
        }),
      ).toEqual(11);

      expect(
        await prismaService.refreshToken.count({
          where: {
            platformUserId: secondPlatformUser.id,
          },
        }),
      ).not.toBe(0);

      await tasksService.cleanupExpiredRefreshTokens();

      // Other platform refresh tokens should not be affected
      expect(
        await prismaService.refreshToken.count({
          where: {
            platformUserId: secondPlatformUser.id,
          },
        }),
      ).not.toBe(0);

      // Only the one with count above 10 should be deleted
      expect(
        await prismaService.refreshToken.count({
          where: { platformUserId: firstPlatformUser.id },
        }),
      ).toEqual(0);
    });
  });
});
