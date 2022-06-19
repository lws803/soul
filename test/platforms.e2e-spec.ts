import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import { UserRole } from 'src/roles/role.enum';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';

describe('PlatformsController (e2e)', () => {
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
    await platformCategoryRepository.delete({});
    await app.close();
  });

  describe('/platforms (POST)', () => {
    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('creates a new platform', async () => {
      const createPlatformDto = factories.createPlatformRequestDto.build({
        redirect_uris: ['https://example.com/redirect'],
      });

      await request(app.getHttpServer())
        .post('/platforms')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(createPlatformDto)
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            name_handle: expect.any(String),
            redirect_uris: ['https://example.com/redirect'],
            name: 'TEST_PLATFORM',
            is_verified: false,
          }),
        );

      const platformUser = await platformUserRepository.findOne({
        user: userAccount.user,
      });
      expect(platformUser).toBeDefined();
      expect(platformUser.roles).toEqual([UserRole.Admin, UserRole.Member]);
    });

    it('throws when user is not logged in', async () => {
      const createPlatformDto = factories.createPlatformRequestDto.build();

      await request(app.getHttpServer())
        .post('/platforms')
        .send(createPlatformDto)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'UNAUTHORIZED_ERROR',
            message: 'Unauthorized',
          }),
        );
    });
  });

  describe('/platforms (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save([
        factories.onePlatform.build({
          redirectUris: ['https://www.example.com'],
        }),
        factories.onePlatform.build({
          id: 2,
          name: 'TEST_PLATFORM_2',
          nameHandle: 'TEST_PLATFORM_2#2',
          isVerified: false,
          category: null,
        }),
      ]);
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches all platforms', async () => {
      await request(app.getHttpServer())
        .get('/platforms')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                is_verified: true,
                name_handle: 'TEST_PLATFORM#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
              },
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                is_verified: false,
                name_handle: 'TEST_PLATFORM_2#2',
                category: null,
              },
            ],
            total_count: 2,
          }),
        );
    });

    it('paginates correctly', async () => {
      await request(app.getHttpServer())
        .get('/platforms?numItemsPerPage=1&page=1')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                name_handle: 'TEST_PLATFORM#1',
                is_verified: true,
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
              },
            ],
            total_count: 2,
          }),
        );
    });

    it('fetches all platforms with is_verified filter', async () => {
      await request(app.getHttpServer())
        .get('/platforms?is_verified=true')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                is_verified: true,
                name_handle: 'TEST_PLATFORM#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
              },
            ],
            total_count: 1,
          }),
        );
    });

    it('fetches all platforms with category filter', async () => {
      await request(app.getHttpServer())
        .get('/platforms?category=CATEGORY')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                is_verified: true,
                name_handle: 'TEST_PLATFORM#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
              },
            ],
            total_count: 1,
          }),
        );
    });

    it('throws unknown category error when category does not exist', async () => {
      await request(app.getHttpServer())
        .get('/platforms?category=UNKNOWN_CATEGORY')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PLATFORM_CATEGORY_NOT_FOUND',
            message:
              'The category with name: UNKNOWN_CATEGORY was not found, please try again.',
          }),
        );
    });

    it('fetches all platforms with full text search', async () => {
      await request(app.getHttpServer())
        .get('/platforms?q=TEST_PLATFORM_2')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                is_verified: false,
                name_handle: 'TEST_PLATFORM_2#2',
                category: null,
              },
            ],
            total_count: 1,
          }),
        );
    });
  });

  describe('/platforms/:platformId (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save(
        factories.onePlatform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches a platform by id', async () => {
      await request(app.getHttpServer())
        .get('/platforms/1')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            name: 'TEST_PLATFORM',
            name_handle: 'TEST_PLATFORM#1',
            is_verified: true,
            category: {
              id: 1,
              name: 'CATEGORY',
            },
          }),
        );
    });

    it('throws not found', async () => {
      await request(app.getHttpServer())
        .get('/platforms/999')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PLATFORM_NOT_FOUND',
            message:
              'The platform with id: 999 was not found, please try again.',
          }),
        );
    });
  });

  describe('/platforms/:platformId (PATCH)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          user: userAccount.user,
          platform,
        }),
      );
    });

    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('updates existing platform', async () => {
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
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: 1,
            name: 'TEST_PLATFORM_2',
            name_handle: 'TEST_PLATFORM_2#1',
            is_verified: true,
            redirect_uris: ['https://www.example.com'],
          }),
        );
    });

    it('throws when insufficient permissions', async () => {
      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send({ name: 'TEST_PLATFORM_2' })
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

  describe('/platforms/:platformId (DELETE)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          user: userAccount.user,
          platform,
        }),
      );
    });

    it('deletes existing platform', async () => {
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
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws insufficient permissions', async () => {
      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
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

  describe('/platforms/:platformId/users (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build({
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
                  user_handle: 'TEST_USER#1',
                  username: 'TEST_USER',
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
        factories.onePlatform.build({
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
              name: 'TEST_PLATFORM',
              is_verified: true,
              name_handle: 'TEST_PLATFORM#1',
              category: {
                id: 1,
                name: 'CATEGORY',
              },
            },
            roles: [UserRole.Admin, UserRole.Member],
            user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
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
              name: 'TEST_PLATFORM',
              name_handle: 'TEST_PLATFORM#1',
              category: {
                id: 1,
                name: 'CATEGORY',
              },
            },
            roles: [UserRole.Banned],
            user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
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
        factories.onePlatform.build({
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
        factories.onePlatform.build({
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
        factories.onePlatform.build({
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
              name: 'TEST_PLATFORM',
              name_handle: 'TEST_PLATFORM#1',
              updated_at: expect.any(String),
              category: {
                id: 1,
                name: 'CATEGORY',
              },
            },
            roles: [UserRole.Member],
            user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
          }),
        );
    });
  });
});
