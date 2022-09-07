import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import * as request from 'supertest';

import { User } from 'src/users/entities/user.entity';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    connection = app.get(Connection);
    userRepository = connection.getRepository(User);
    await connection.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    afterEach(async () => {
      await userRepository.delete({});
    });

    it('creates a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send(
          factories.createUserDto.build({
            password: '3Yarw#Nm%cpY9QV&',
          }),
        )
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toMatchSnapshot({
            created_at: expect.any(String),
            updated_at: expect.any(String),
          });
        });
    });

    it('throws user duplicate error', async () => {
      const existingUser = factories.user.build();
      await userRepository.save(existingUser);
      return request(app.getHttpServer())
        .post('/users')
        .send(
          factories.createUserDto.build({
            email: existingUser.email,
            username: existingUser.username,
            password: '3Yarw#Nm%cpY9QV&',
          }),
        )
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            error: 'DUPLICATE_USER_EXISTS',
            message:
              'A user with the email address: TEST_USER_1@EMAIL.COM already exists. ' +
              'Please login or use a different email address.',
          });
        });
    });
  });

  describe('/users (GET)', () => {
    beforeAll(async () => {
      await userRepository.save([
        factories.user.build({ id: undefined }),
        factories.user.build({
          id: undefined,
          username: 'TEST_USER_2',
          userHandle: 'test_user_2#2',
          email: 'TEST_USER_2@EMAIL.COM',
        }),
      ]);
    });

    afterAll(async () => {
      await userRepository.delete({});
    });

    it('should return full list of users', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toMatchSnapshot());
    });

    it('should return partial list of users with pagination', async () => {
      return request(app.getHttpServer())
        .get('/users?page=1&num_items_per_page=1')
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toMatchSnapshot());
    });

    it('should return partial list of users with full text search', async () => {
      return request(app.getHttpServer())
        .get('/users?q=TEST_USER_2')
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toMatchSnapshot());
    });
  });

  describe('/users/:id (GET)', () => {
    beforeAll(async () => {
      await userRepository.save(factories.user.build());
    });

    afterAll(async () => {
      await userRepository.delete({});
    });

    it('should return a user', async () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toMatchSnapshot());
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
      await userRepository.delete({});
    });

    it('should update myself', async () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(factories.updateUserDto.build())
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toMatchSnapshot({
            id: userAccount.user.id,
            user_handle: `updated_user#${userAccount.user.id}`,
            created_at: expect.any(String),
            updated_at: expect.any(String),
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
      await userRepository.delete({});
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
      await userRepository.delete({});
    });

    it('retrieves me', async () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toMatchSnapshot({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            user_handle: expect.any(String),
          }),
        );
    });
  });
});
