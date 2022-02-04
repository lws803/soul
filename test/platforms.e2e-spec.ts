import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';

import { UserRole } from 'src/roles/role.enum';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';

import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';

import * as factories from '../factories';

describe('PlatformsController (e2e)', () => {
  let app: INestApplication;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;

  let userAccount: UserAccount;
  let secondUserAccount: UserAccount;
  let thirdUserAccount: UserAccount;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    const connection = app.get(Connection);
    await connection.synchronize(true);

    platformUserRepository = connection.getRepository(PlatformUser);
    platformRepository = connection.getRepository(Platform);

    const [firstUser, secondUser, thirdUser] = await createUsersAndLoginFixture(
      app,
    );
    userAccount = firstUser;
    secondUserAccount = secondUser;
    thirdUserAccount = thirdUser;
  });

  afterAll((done) => {
    app.close().then(done);
  });

  describe('/platforms (POST)', () => {
    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('creates a new platform', async () => {
      const createPlatformDto = factories.createPlatformDto.build({
        hostUrl: 'https://example.com',
        redirectUris: ['https://example.com/redirect'],
      });

      await request(app.getHttpServer())
        .post('/platforms')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('X-Forwarded-Host', 'localhost:3000')
        .send(createPlatformDto)
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(Number),
            nameHandle: expect.any(String),
            hostUrl: 'https://example.com',
            redirectUris: ['https://example.com/redirect'],
            name: 'TEST_PLATFORM',
            isVerified: false,
          }),
        );

      const platformUser = await platformUserRepository.findOne({
        user: userAccount.user,
      });
      expect(platformUser).toBeDefined();
      expect(platformUser.roles).toEqual([UserRole.ADMIN, UserRole.MEMBER]);
    });

    it('throws when user is not logged in', async () => {
      const createPlatformDto = factories.createPlatformDto.build({
        hostUrl: 'https://example.com',
      });

      await request(app.getHttpServer())
        .post('/platforms')
        .send(createPlatformDto)
        .expect(401)
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
        factories.onePlatform.build(),
        factories.onePlatform.build({
          id: 2,
          name: 'TEST_PLATFORM_2',
          nameHandle: 'TEST_PLATFORM_2#2',
          isVerified: false,
        }),
      ]);
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches all platforms', async () => {
      await request(app.getHttpServer())
        .get('/platforms')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                isVerified: true,
                nameHandle: 'TEST_PLATFORM#1',
              },
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                isVerified: false,
                nameHandle: 'TEST_PLATFORM_2#2',
              },
            ],
            totalCount: 2,
          }),
        );
    });

    it('paginates correctly', async () => {
      await request(app.getHttpServer())
        .get('/platforms?numItemsPerPage=1&page=1')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                nameHandle: 'TEST_PLATFORM#1',
                isVerified: true,
              },
            ],
            totalCount: 2,
          }),
        );
    });

    it('fetches all platforms with isVerified filter', async () => {
      await request(app.getHttpServer())
        .get('/platforms?isVerified=true')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                isVerified: true,
                nameHandle: 'TEST_PLATFORM#1',
              },
            ],
            totalCount: 1,
          }),
        );
    });
  });

  describe('/platforms/:platformId (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save(factories.onePlatform.build());
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches a platform by id', async () => {
      await request(app.getHttpServer())
        .get('/platforms/1')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            hostUrl: 'TEST_HOST_URL',
            id: expect.any(Number),
            name: 'TEST_PLATFORM',
            nameHandle: 'TEST_PLATFORM#1',
            isVerified: true,
          }),
        );
    });

    it('throws not found', async () => {
      await request(app.getHttpServer())
        .get('/platforms/999')
        .expect(404)
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
        factories.onePlatform.build(),
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
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            hostUrl: 'TEST_HOST_URL',
            id: 1,
            name: 'TEST_PLATFORM_2',
            nameHandle: 'TEST_PLATFORM_2#1',
            isVerified: true,
            redirectUris: ['TEST_REDIRECT_URI'],
          }),
        );
    });

    it('throws when insufficient permissions', async () => {
      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('X-Forwarded-Host', 'localhost:3000')
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(403)
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
        factories.onePlatform.build(),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          user: userAccount.user,
          platform,
        }),
      );
    });

    it('deletes existing platform', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws insufficient permissions', async () => {
      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('X-Forwarded-Host', 'localhost:3000')
        .expect(403)
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
        factories.onePlatform.build(),
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
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .get('/platforms/1/users')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            totalCount: 1,
            platformUsers: [
              {
                id: 1,
                roles: [UserRole.ADMIN, UserRole.MEMBER],
                user: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
              },
            ],
          }),
        );
    });

    it('throws due to insufficient permissions and invalid audience', async () => {
      await request(app.getHttpServer())
        .get('/platforms/1/users')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(401)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'UNAUTHORIZED_USER',
            message: 'Invalid audience.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/users/:userId (PUT)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build(),
      );
      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.MEMBER],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('sets user role', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/2?roles=admin,member')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            platform: {
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              hostUrl: 'TEST_HOST_URL',
              id: 1,
              name: 'TEST_PLATFORM',
              isVerified: true,
              nameHandle: 'TEST_PLATFORM#1',
            },
            roles: [UserRole.ADMIN, UserRole.MEMBER],
            user: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('bans a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/2?roles=banned')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            platform: {
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              hostUrl: 'TEST_HOST_URL',
              id: 1,
              isVerified: true,
              name: 'TEST_PLATFORM',
              nameHandle: 'TEST_PLATFORM#1',
            },
            roles: [UserRole.BANNED],
            user: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('throws an error when trying to set only remaining admin to member', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/1?roles=member')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'NO_ADMINS_REMAINING',
            message:
              'It seems like you might be the last admin of this platform. You need to appoint another admin before performing this action.',
          }),
        );
    });

    it('throws with insufficient permissions', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/1?roles=admin,member')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(403)
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
        factories.onePlatform.build(),
      );
      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.MEMBER],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('deletes a platform user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws due to insufficient permissions', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/1')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(403)
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
      platform = await platformRepository.save(factories.onePlatform.build());

      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.MEMBER],
        }),
        factories.onePlatformUser.build({
          id: 3,
          user: thirdUserAccount.user,
          platform,
          roles: [UserRole.BANNED],
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
          roles: [UserRole.ADMIN, UserRole.MEMBER],
        }),
      );
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('quits existing platform (MEMBER)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    // Banned users cannot quit a platform to prevent them from joining again
    it('quits existing platform (BANNED)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_3@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });

    it('only remaining admin cant quit', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('X-Forwarded-Host', 'TEST_HOST_URL')
        .expect(403)
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
      await platformRepository.save(factories.onePlatform.build());
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('adds myself as a platform user', async () => {
      await request(app.getHttpServer())
        .post('/platforms/1/join')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('X-Forwarded-Host', 'localhost:3000')
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            id: expect.any(Number),
            platform: {
              createdAt: expect.any(String),
              hostUrl: 'TEST_HOST_URL',
              id: 1,
              isVerified: true,
              name: 'TEST_PLATFORM',
              nameHandle: 'TEST_PLATFORM#1',
              updatedAt: expect.any(String),
            },
            roles: [UserRole.MEMBER],
            user: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
          }),
        );
    });
  });
});
