import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../factories';

import { resetDatabase } from './utils/reset-database';
import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    prismaService = app.get<PrismaService>(PrismaService);
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    afterEach(async () => {
      await prismaService.user.deleteMany();
    });

    it('creates a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send(
          factories.createUserRequest.build({
            password: '3Yarw#Nm%cpY9QV&',
          }),
        )
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: expect.any(Number),
            email: 'TEST_USER@EMAIL.COM',
            username: 'test-user',
            user_handle: expect.stringContaining('test-user#'),
            is_active: false,
            created_at: expect.any(String),
            updated_at: expect.any(String),
            display_name: null,
            bio: null,
          });
        });
    });

    it('throws user duplicate error due to duplicate email address', async () => {
      const existingUser = factories.userEntity.build();
      await prismaService.user.create({ data: existingUser });
      return request(app.getHttpServer())
        .post('/users')
        .send(
          factories.createUserRequest.build({
            email: existingUser.email,
            username: existingUser.username,
            password: '3Yarw#Nm%cpY9QV&',
          }),
        )
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            error: 'DUPLICATE_USER_EMAIL_EXISTS',
            message:
              'A user with the email address: TEST_USER_1@EMAIL.COM already exists. ' +
              'Please login or use a different email address.',
          });
        });
    });

    it('throws user duplicate error due to duplicate username', async () => {
      const existingUser = factories.userEntity.build();
      await prismaService.user.create({ data: existingUser });
      return request(app.getHttpServer())
        .post('/users')
        .send(
          factories.createUserRequest.build({
            email: 'NEW_EMAIL@MAIL.COM',
            username: existingUser.username,
            password: '3Yarw#Nm%cpY9QV&',
          }),
        )
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            error: 'DUPLICATE_USERNAME_EXISTS',
            message:
              'A user with the username: test-user-1 already exists. Please login or use a different username.',
          });
        });
    });
  });

  describe('/users (GET)', () => {
    beforeAll(async () => {
      await prismaService.user.createMany({
        data: [
          factories.userEntity.build({ id: undefined }),
          factories.userEntity.build({
            id: undefined,
            username: 'test-user-2',
            userHandle: 'test-user-2#2',
            email: 'TEST_USER_2@EMAIL.COM',
          }),
        ],
      });
    });

    afterAll(async () => {
      await prismaService.user.deleteMany();
    });

    it('should return full list of users', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            total_count: 2,
            users: [
              {
                id: expect.any(Number),
                user_handle: 'test-user-2#2',
                username: 'test-user-2',
                bio: 'BIO',
                display_name: 'DISPLAY_NAME',
              },
              {
                id: expect.any(Number),
                user_handle: 'test-user-1#1',
                username: 'test-user-1',
                bio: 'BIO',
                display_name: 'DISPLAY_NAME',
              },
            ],
          });
        });
    });

    it('should return partial list of users with pagination', async () => {
      return request(app.getHttpServer())
        .get('/users?page=1&num_items_per_page=1')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            total_count: 2,
            users: [
              {
                id: expect.any(Number),
                user_handle: 'test-user-2#2',
                username: 'test-user-2',
                bio: 'BIO',
                display_name: 'DISPLAY_NAME',
              },
            ],
          });
        });
    });

    it('should return partial list of users with full text search', async () => {
      return request(app.getHttpServer())
        .get('/users?q=test-user-2')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            total_count: 1,
            users: [
              {
                id: expect.any(Number),
                user_handle: 'test-user-2#2',
                username: 'test-user-2',
                bio: 'BIO',
                display_name: 'DISPLAY_NAME',
              },
            ],
          });
        });
    });
  });

  describe('/users/:id (GET)', () => {
    beforeAll(async () => {
      await prismaService.user.create({ data: factories.userEntity.build() });
    });

    afterAll(async () => {
      await prismaService.user.deleteMany();
    });

    it('should return a user', async () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: expect.any(Number),
            user_handle: 'test-user-1#1',
            username: 'test-user-1',
            bio: 'BIO',
            display_name: 'DISPLAY_NAME',
          });
        });
    });

    it('should return user not found', async () => {
      return request(app.getHttpServer())
        .get('/users/999')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            error: 'USER_NOT_FOUND',
            message:
              'A user with the id: 999 could not be found, please try again.',
          });
        });
    });
  });

  describe('/users/:id (PATCH)', () => {
    let userAccount: UserAccount;

    beforeEach(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;
    });

    afterEach(async () => {
      await prismaService.user.deleteMany();
    });

    it('should update myself', async () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(factories.updateUserRequest.build())
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: userAccount.user.id,
            user_handle: `updated-user#${userAccount.user.id}`,
            username: 'updated-user',
            email: 'UPDATED_EMAIL@EMAIL.COM',
            is_active: true,
            created_at: expect.any(String),
            updated_at: expect.any(String),
            bio: 'UPDATED_BIO',
            display_name: 'UPDATED_DISPLAY_NAME',
          });
        });
    });

    it('should fail validation when updating myself', async () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(factories.updateUserRequest.build({ username: 'Hello--test%^&' }))
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            constraints: [
              'Username can only contain lowercase alphanumeric characters with the exception of hyphens.',
            ],
            error: 'VALIDATION_ERROR',
            message: 'Validation error.',
          });
        });
    });

    it('should fail due to duplicate username', async () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(factories.updateUserRequest.build({ username: 'test-user-2' }))
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            message:
              'A user with the username: test-user-2 already exists. Please login or use a different username.',
            error: 'DUPLICATE_USERNAME_EXISTS',
          });
        });
    });

    it('should fail due to duplicate email', async () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(
          factories.updateUserRequest.build({ email: 'TEST_USER_2@EMAIL.COM' }),
        )
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            message:
              'A user with the email address: TEST_USER_2@EMAIL.COM already exists. ' +
              'Please login or use a different email address.',
            error: 'DUPLICATE_USER_EMAIL_EXISTS',
          });
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userAccount: UserAccount;

    beforeEach(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;
    });

    afterEach(async () => {
      await prismaService.user.deleteMany();
    });

    it('should delete myself', async () => {
      return request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({});
        });
    });
  });

  describe('/users/me (GET)', () => {
    let firstUserAccessToken;

    beforeAll(async () => {
      const [{ accessToken }] = await createUsersAndLoginFixture(app);
      firstUserAccessToken = accessToken;
    });

    afterAll(async () => {
      await prismaService.user.deleteMany();
    });

    it('retrieves me', async () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            email: 'TEST_USER@EMAIL.COM',
            is_active: true,
            user_handle: expect.any(String),
            username: 'test-user',
            display_name: null,
            bio: null,
          }),
        );
    });
  });
});
