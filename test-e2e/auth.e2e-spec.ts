import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';
import { User, Platform } from '@prisma/client';

import { UserRole } from 'src/roles/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import { createUsersAndLoginFixture } from './fixtures/create-users-and-login-fixture';
import { resetDatabase } from './utils/reset-database';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const codeVerifier = 'CODE_VERIFIER';
  const codeChallenge = base64url(sha256(codeVerifier).toString(), 'hex');

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    prismaService = app.get<PrismaService>(PrismaService);
    await resetDatabase();

    await prismaService.platformCategory.create({
      data: factories.platformCategoryEntity.build(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    let userAccount: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    beforeAll(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;

      const platform = await prismaService.platform.create({
        data: factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      });
      await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          platformId: platform.id,
          userId: userAccount.user.id,
        }),
      });
    });

    afterAll(async () => {
      await prismaService.platformUser.deleteMany();
      await prismaService.platform.deleteMany();
      await prismaService.user.deleteMany();
    });

    it('logs in successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.headers['cache-control']).toBe('no-store');
          expect(res.body).toEqual({
            access_token: expect.any(String),
            expires_in: 900,
          });
        });
    });

    it('logs in successfully for platform', async () => {
      const params = new URLSearchParams({
        code_challenge: codeChallenge,
        state: 'TEST_STATE',
        redirect_uri: 'https://www.example.com',
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.headers['cache-control']).toBe('no-store');
          expect(res.body).toEqual({
            access_token: expect.any(String),
            refresh_token: expect.any(String),
            platform_id: 1,
            roles: [UserRole.Admin, UserRole.Member],
            expires_in: 900,
          });
        });
    });

    it('fails to login with wrong credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'WRONG_PASSWORD' })
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'UNAUTHORIZED_USER',
            message: 'Incorrect email and password combination.',
          }),
        );
    });

    it('fails to login with platform due to PKCE mismatch', async () => {
      const params = new URLSearchParams({
        code_challenge: 'UNKNOWN_CODE',
        state: 'TEST_STATE',
        redirect_uri: 'https://www.example.com',
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        })
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.headers['cache-control']).toBe('no-store');
          expect(res.body).toEqual({
            error: 'INVALID_CODE_CHALLENGE',
            message: 'Code challenge and code verifier does not match.',
          });
        });
    });

    it('fails to login with platform due to not being a member', async () => {
      await prismaService.platform.create({
        data: factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          id: 2,
          name: 'TEST_PLATFORM_2',
          nameHandle: 'test_platform_2#2',
        }),
      });
      const params = new URLSearchParams({
        code_challenge: codeChallenge,
        state: 'TEST_STATE',
        redirect_uri: 'https://www.example.com',
        client_id: String(2),
      });
      await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' })
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'PLATFORM_USER_NOT_FOUND',
            message:
              'The user with username: test-user#1 was not found on ' +
              'platform: test_platform_2#2, please try again.',
          });
        });
    });
  });

  describe('/auth/oauth/refresh-token', () => {
    let userAccount: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    beforeAll(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;

      const platform = await prismaService.platform.create({
        data: factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      });
      await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          platformId: platform.id,
          userId: userAccount.user.id,
        }),
      });
    });

    afterAll(async () => {
      await prismaService.platformUser.deleteMany();
      await prismaService.platform.deleteMany();
      await prismaService.user.deleteMany();
    });

    it('refreshes token for platform successfully', async () => {
      const params = new URLSearchParams({
        code_challenge: codeChallenge,
        state: 'TEST_STATE',
        redirect_uri: 'https://www.example.com',
        client_id: String(1),
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
        .send({ refresh_token, client_id: 1 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.headers['cache-control']).toBe('no-store');
          expect(res.body).toEqual({
            access_token: expect.any(String),
            refresh_token: expect.any(String),
            platform_id: 1,
            roles: [UserRole.Admin, UserRole.Member],
            expires_in: 900,
          });
        });
    });

    it('refreshes token for platform without specifying platform id', async () => {
      const params = new URLSearchParams({
        code_challenge: codeChallenge,
        state: 'TEST_STATE',
        redirect_uri: 'https://www.example.com',
        client_id: String(1),
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
        .send({ refresh_token })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) =>
          expect(res.body).toEqual({
            constraints: ['client_id must be an integer'],
            error: 'VALIDATION_ERROR',
            message: 'Validation error.',
          }),
        );
    });

    it('fails when refreshing with access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/refresh-token')
        .send({ refresh_token: userAccount.accessToken, client_id: 1 })
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'INVALID_TOKEN',
            message:
              'Access token used in place of refresh token, please try again.',
          }),
        );
    });

    it('fails when refresh token is invalid or corrupted', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/refresh-token')
        .send({
          refresh_token: userAccount.refreshToken + 'INVALID',
          client_id: 1,
        })
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'INVALID_TOKEN',
            message: 'Invalid token used.',
          }),
        );
    });
  });

  describe('/auth/oauth/client-credentials, (POST)', () => {
    let platform: Platform;

    beforeAll(async () => {
      platform = await prismaService.platform.create({
        data: factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          clientSecret: 'CLIENT_SECRET',
        }),
      });
    });

    afterAll(async () => {
      await prismaService.platform.deleteMany();
    });

    it('authenticates client successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_id: platform.id,
          client_secret: platform.clientSecret,
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.headers['cache-control']).toBe('no-store');
          expect(res.body).toEqual({
            access_token: expect.any(String),
            expires_in: 63072000,
            platform_id: 1,
          });
        });
    });
  });
});
