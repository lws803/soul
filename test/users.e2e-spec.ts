import { INestApplication } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import * as request from 'supertest';

import { User } from 'src/users/entities/user.entity';

import createAppFixture from './create-app-fixture';
import { createUsersAndLogin, UserAccount } from './create-users-and-login';

import * as factories from '../factories';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();

    connection = app.get(Connection);
    userRepository = connection.getRepository(User);
    await connection.synchronize(true);
  });

  afterAll((done) => {
    app.close().then(done);
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
        .expect(201)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: 1,
            email: 'TEST_USER@EMAIL.COM',
            username: 'TEST_USER',
            userHandle: 'TEST_USER#1',
            isActive: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('throws user duplicate error', async () => {
      await userRepository.save(factories.oneUser.build());
      return request(app.getHttpServer())
        .post('/users')
        .send(factories.createUserDto.build({ password: '3Yarw#Nm%cpY9QV&' }))
        .expect(409)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            error: 'DUPLICATE_USER_EXISTS',
            message:
              'A user with the email address: TEST_USER@EMAIL.COM already exists. ' +
              'Please login or use a different email address.',
          });
        });
    });
  });

  describe('/users (GET)', () => {
    beforeAll(async () => {
      await userRepository.save([
        factories.oneUser.build({ id: undefined }),
        factories.oneUser.build({
          id: undefined,
          username: 'TEST_USER_2',
          userHandle: 'TEST_USER_2#2',
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
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            totalCount: 2,
            users: [
              {
                id: expect.any(Number),
                userHandle: 'TEST_USER#1',
                username: 'TEST_USER',
              },
              {
                id: expect.any(Number),
                userHandle: 'TEST_USER_2#2',
                username: 'TEST_USER_2',
              },
            ],
          });
        });
    });

    it('should return partial list of users with pagination', async () => {
      return request(app.getHttpServer())
        .get('/users?page=1&numItemsPerPage=1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            totalCount: 2,
            users: [
              {
                id: expect.any(Number),
                userHandle: 'TEST_USER#1',
                username: 'TEST_USER',
              },
            ],
          });
        });
    });
  });

  describe('/users/:id (GET)', () => {
    beforeAll(async () => {
      await userRepository.save(factories.oneUser.build());
    });

    afterAll(async () => {
      await userRepository.delete({});
    });

    it('should return a user', async () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: expect.any(Number),
            userHandle: 'TEST_USER#1',
            username: 'TEST_USER',
          });
        });
    });

    it('should return user not found', async () => {
      return request(app.getHttpServer())
        .get('/users/999')
        .expect(404)
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
      const { firstUser } = await createUsersAndLogin(app);
      userAccount = firstUser;
    });

    afterEach(async () => {
      await userRepository.delete({});
    });

    it('should update myself', async () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('Host', 'localhost:3000')
        .send(factories.updateUserDto.build())
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: userAccount.user.id,
            userHandle: `UPDATED_USER#${userAccount.user.id}`,
            username: 'UPDATED_USER',
            email: 'UPDATED_EMAIL@EMAIL.COM',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userAccount: UserAccount;

    beforeEach(async () => {
      const { firstUser } = await createUsersAndLogin(app);
      userAccount = firstUser;
    });

    afterEach(async () => {
      await userRepository.delete({});
    });

    it('should delete myself', async () => {
      return request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({});
        });
    });
  });

  describe('/users/me (GET)', () => {
    let firstUserAccessToken;

    beforeAll(async () => {
      const {
        firstUser: { accessToken },
      } = await createUsersAndLogin(app);
      firstUserAccessToken = accessToken;
    });

    afterAll(async () => {
      await userRepository.delete({});
    });

    it('retrieves me', async () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(Number),
            email: 'TEST_USER@EMAIL.COM',
            isActive: true,
            userHandle: expect.any(String),
            username: 'TEST_USER',
          }),
        );
    });
  });
});
