import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import { User } from 'src/users/entities/user.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';
import { UserRole } from 'src/roles/role.enum';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import { createUsersAndLoginFixture } from './fixtures/create-users-and-login-fixture';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;
  let platformCategoryRepository: Repository<PlatformCategory>;

  const codeVerifier = 'CODE_VERIFIER';
  const codeChallenge = base64url(sha256(codeVerifier).toString(), 'hex');

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    const connection = app.get(Connection);
    await connection.synchronize(true);

    userRepository = connection.getRepository(User);
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

  describe('/auth/login (POST)', () => {
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
      await platformUserRepository.delete({});
      await platformRepository.delete({});
      await userRepository.delete({});
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
        .post('/auth/verify')
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
        .post('/auth/verify')
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
      await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          id: 2,
          name: 'TEST_PLATFORM_2',
          nameHandle: 'test_platform_2#2',
        }),
      );
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

  describe('/auth/refresh', () => {
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
      await platformUserRepository.delete({});
      await platformRepository.delete({});
      await userRepository.delete({});
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
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      const { refresh_token } = resp.body;

      await request(app.getHttpServer())
        .post('/auth/refresh')
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
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      const { refresh_token } = resp.body;

      await request(app.getHttpServer())
        .post('/auth/refresh')
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
        .post('/auth/refresh')
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
        .post('/auth/refresh')
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
});
