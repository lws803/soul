import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import { UserRole } from 'src/roles/role.enum';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';

import * as factories from '../../factories';
import createAppFixture from '../fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from '../fixtures/create-users-and-login-fixture';

describe('PlatformsController - PlatformUsers (e2e)', () => {
  let app: INestApplication;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;
  let platformCategoryRepository: Repository<PlatformCategory>;

  let userAccount: UserAccount;
  let secondUserAccount: UserAccount;
  let thirdUserAccount: UserAccount;

  const codeVerifier = 'CODE_VERIFIER';
  const codeChallenge = base64url(sha256(codeVerifier).toString(), 'hex');

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    const connection = app.get(Connection);
    await connection.synchronize(true);

    platformUserRepository = connection.getRepository(PlatformUser);
    platformRepository = connection.getRepository(Platform);
    platformCategoryRepository = connection.getRepository(PlatformCategory);

    const [firstUser, secondUser, thirdUser] = await createUsersAndLoginFixture(
      app,
    );
    userAccount = firstUser;
    secondUserAccount = secondUser;
    thirdUserAccount = thirdUser;

    await platformCategoryRepository.save(
      factories.onePlatformCategory.build(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/platforms/:platformId/users (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.platform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
      );
    });

    afterAll(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('fetches all users within a platform', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .get('/platforms/1/users')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            total_count: 1,
            platform_users: [
              {
                id: 1,
                roles: [UserRole.Admin, UserRole.Member],
                user: {
                  id: 1,
                  user_handle: 'test_user#1',
                  username: 'TEST_USER',
                },
                platform: {
                  id: 1,
                  is_verified: true,
                  name: 'TEST_PLATFORM_1',
                  name_handle: 'test_platform_1#1',
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              },
            ],
          }),
        );
    });
  });

  describe('/platforms/:platformId/users/:userId (PUT)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.platform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.Member],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('sets user role', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .put('/platforms/1/users/2?roles=admin,member')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            platform: {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              id: 1,
              name: 'TEST_PLATFORM_1',
              is_verified: true,
              name_handle: 'test_platform_1#1',
              category: {
                id: 1,
                name: 'CATEGORY',
              },
            },
            roles: [UserRole.Admin, UserRole.Member],
            user: {
              id: 2,
              user_handle: 'test_user_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('bans a user', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .put('/platforms/1/users/2?roles=banned')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            platform: {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              id: 1,
              is_verified: true,
              name: 'TEST_PLATFORM_1',
              name_handle: 'test_platform_1#1',
              category: {
                id: 1,
                name: 'CATEGORY',
              },
            },
            roles: [UserRole.Banned],
            user: {
              id: 2,
              user_handle: 'test_user_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('throws an error when trying to set only remaining admin to member', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .put('/platforms/1/users/1?roles=member')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'NO_ADMINS_REMAINING',
            message:
              'It seems like you might be the last admin of this platform. ' +
              'You need to appoint another admin before performing this action.',
          }),
        );
    });

    it('throws with insufficient permissions', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .put('/platforms/1/users/1?roles=admin,member')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/users/:userId (DELETE)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.platform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.Member],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('deletes a platform user', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws due to insufficient permissions', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/quit (DELETE)', () => {
    let platform: Platform;

    beforeEach(async () => {
      platform = await platformRepository.save(
        factories.platform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );

      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.Member],
        }),
        factories.onePlatformUser.build({
          id: 3,
          user: thirdUserAccount.user,
          platform,
          roles: [UserRole.Banned],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('quits existing platform (ADMIN)', async () => {
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.Admin, UserRole.Member],
        }),
      );

      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('quits existing platform (MEMBER)', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toEqual({}));
    });

    // Banned users cannot quit a platform to prevent them from joining again
    it('quits existing platform (BANNED)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'TEST_USER_3@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });

    it('only remaining admin cant quit', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'NO_ADMINS_REMAINING',
            message:
              'It seems like you might be the last admin of this platform. You need to ' +
              'appoint another admin before performing this action.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/join (POST)', () => {
    beforeEach(async () => {
      await platformRepository.save(
        factories.platform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('adds myself as a platform user', async () => {
      await request(app.getHttpServer())
        .post('/platforms/1/join')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toEqual({
            id: expect.any(Number),
            platform: {
              created_at: expect.any(String),
              id: 1,
              is_verified: true,
              name: 'TEST_PLATFORM_1',
              name_handle: 'test_platform_1#1',
              updated_at: expect.any(String),
              category: {
                id: 1,
                name: 'CATEGORY',
              },
            },
            roles: [UserRole.Member],
            user: {
              id: 1,
              user_handle: 'test_user#1',
              username: 'TEST_USER',
            },
          }),
        );
    });
  });
});
