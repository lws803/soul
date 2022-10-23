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
      factories.platformCategoryEntity.build(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/platforms/:platform_id/users (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          clientSecret: 'CLIENT_SECRET',
        }),
      );
      await platformUserRepository.save([
        factories.platformUserEntity.build({
          user: userAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
          id: 3,
          user: thirdUserAccount.user,
          platform,
        }),
      ]);
    });

    afterAll(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('fetches all users within a platform', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .get('/platforms/1/users')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            total_count: 3,
            platform_users: [
              {
                id: expect.any(Number),
                roles: [UserRole.Admin, UserRole.Member],
                profile_url: 'PROFILE_URL',
                user: {
                  id: expect.any(Number),
                  user_handle: 'test-user#1',
                  username: 'test-user',
                  bio: null,
                  display_name: null,
                  email: 'TEST_USER@EMAIL.COM',
                  is_active: true,
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              },
              {
                id: expect.any(Number),
                roles: [UserRole.Admin, UserRole.Member],
                profile_url: 'PROFILE_URL',
                user: {
                  id: expect.any(Number),
                  user_handle: 'test-user-2#2',
                  username: 'test-user-2',
                  bio: null,
                  display_name: null,
                  email: 'TEST_USER_2@EMAIL.COM',
                  is_active: true,
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              },
              {
                id: expect.any(Number),
                roles: [UserRole.Admin, UserRole.Member],
                profile_url: 'PROFILE_URL',
                user: {
                  id: expect.any(Number),
                  user_handle: 'test-user-3#3',
                  username: 'test-user-3',
                  bio: null,
                  display_name: null,
                  email: 'TEST_USER_3@EMAIL.COM',
                  is_active: true,
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              },
            ],
          }),
        );
    });

    it('fetches all users within a platform with filters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .get('/platforms/1/users?uid=1&uid=2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            total_count: 2,
            platform_users: [
              {
                id: expect.any(Number),
                roles: [UserRole.Admin, UserRole.Member],
                profile_url: 'PROFILE_URL',
                user: {
                  id: expect.any(Number),
                  user_handle: 'test-user#1',
                  username: 'test-user',
                  bio: null,
                  display_name: null,
                  email: 'TEST_USER@EMAIL.COM',
                  is_active: true,
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              },
              {
                id: expect.any(Number),
                roles: [UserRole.Admin, UserRole.Member],
                profile_url: 'PROFILE_URL',
                user: {
                  id: expect.any(Number),
                  user_handle: 'test-user-2#2',
                  username: 'test-user-2',
                  bio: null,
                  display_name: null,
                  email: 'TEST_USER_2@EMAIL.COM',
                  is_active: true,
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              },
            ],
          }),
        );
    });
  });

  describe('/platforms/:platform_id/users/:user_id (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          clientSecret: 'CLIENT_SECRET',
        }),
      );
      await platformUserRepository.save([
        factories.platformUserEntity.build({
          user: userAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
          id: 3,
          user: thirdUserAccount.user,
          platform,
        }),
      ]);
    });

    afterAll(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('fetches single user within a platform', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .get('/platforms/1/users/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: expect.any(Number),
            roles: [UserRole.Admin, UserRole.Member],
            profile_url: 'PROFILE_URL',
            user: {
              id: expect.any(Number),
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
              email: 'TEST_USER@EMAIL.COM',
              is_active: true,
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          }),
        );
    });

    it('throws not found when user is not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .get('/platforms/1/users/999')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/platforms/:platform_id/users/:user_id (PATCH)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          clientSecret: 'CLIENT_SECRET',
        }),
      );
      await platformUserRepository.save([
        factories.platformUserEntity.build({
          user: userAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
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
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({
          ...factories.updatePlatformUserRequest.build(),
          profile_url: undefined,
        })
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            profile_url: 'PROFILE_URL',
            roles: [UserRole.Admin, UserRole.Member],
            user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
              email: 'TEST_USER_2@EMAIL.COM',
              is_active: true,
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          }),
        );
    });

    it('sets user role and profile url', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send(factories.updatePlatformUserRequest.build())
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            profile_url: 'PROFILE_URL_UPDATE',
            roles: [UserRole.Admin, UserRole.Member],
            user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
              email: 'TEST_USER_2@EMAIL.COM',
              is_active: true,
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          }),
        );
    });

    it('sets user profile url', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({
          ...factories.updatePlatformUserRequest.build(),
          roles: undefined,
        })
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            profile_url: 'PROFILE_URL_UPDATE',
            roles: [UserRole.Member],
            user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
              email: 'TEST_USER_2@EMAIL.COM',
              is_active: true,
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          }),
        );
    });

    it('removes user profile url', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({
          ...factories.updatePlatformUserRequest.build({ profile_url: null }),
          roles: undefined,
        })
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            profile_url: null,
            roles: [UserRole.Member],
            user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
              email: 'TEST_USER_2@EMAIL.COM',
              is_active: true,
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          }),
        );
    });

    it('bans a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({
          ...factories.updatePlatformUserRequest.build({ roles: ['banned'] }),
          profile_url: undefined,
        })
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            profile_url: 'PROFILE_URL',
            roles: [UserRole.Banned],
            user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
              email: 'TEST_USER_2@EMAIL.COM',
              is_active: true,
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          }),
        );
    });

    it('throws an error when trying to set only remaining admin to member', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1/users/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({
          ...factories.updatePlatformUserRequest.build({ roles: ['member'] }),
          profile_url: undefined,
        })
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
  });

  describe('/platforms/:platform_id/users/:user_id (DELETE)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
          clientSecret: 'CLIENT_SECRET',
        }),
      );
      await platformUserRepository.save([
        factories.platformUserEntity.build({
          user: userAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
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
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/client-credentials')
        .send({
          client_secret: 'CLIENT_SECRET',
          client_id: 1,
        });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toEqual({}));
    });
  });

  describe('/platforms/:platform_id/quit (DELETE)', () => {
    let platform: Platform;

    beforeEach(async () => {
      platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );

      await platformUserRepository.save([
        factories.platformUserEntity.build({
          user: userAccount.user,
          platform,
        }),
        factories.platformUserEntity.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.Member],
        }),
        factories.platformUserEntity.build({
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
        factories.platformUserEntity.build({
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
        .post('/auth/oauth/authorization-code')
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
        .post('/auth/oauth/authorization-code')
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
        .post('/auth/oauth/authorization-code')
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

  describe('/platforms/:platform_id/join (POST)', () => {
    beforeEach(async () => {
      await platformRepository.save(
        factories.platformEntity.build({
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
            profile_url: null,
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
              homepage_url: 'HOMEPAGE_URL',
            },
            roles: [UserRole.Member],
            user: {
              id: 1,
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
            },
          }),
        );
    });
  });
});
