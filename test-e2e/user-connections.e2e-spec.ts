import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';
import { resetDatabase } from './utils/reset-database';

describe('UserConnectionsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let firstUser: UserAccount;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    prismaService = app.get<PrismaService>(PrismaService);
    await resetDatabase();

    firstUser = (await createUsersAndLoginFixture(app))[0];

    await prismaService.platformCategory.create({
      data: factories.platformCategoryEntity.build(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/user-connections (POST)', () => {
    afterEach(async () => {
      await prismaService.userConnection.deleteMany();
      await prismaService.platformUser.deleteMany();
      await prismaService.platform.deleteMany();
    });

    it('creates a new connection', async () => {
      return request(app.getHttpServer())
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .send(factories.createUserConnectionRequest.build())
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            from_user: {
              id: 1,
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
            },
            to_user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
            },
            is_mutual: false,
          }),
        );
    });

    it('throws when duplicate', async () => {
      const createUserConnectionReq =
        factories.createUserConnectionRequest.build();
      await request(app.getHttpServer())
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .send(createUserConnectionReq);

      return request(app.getHttpServer())
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .send(createUserConnectionReq)
        .expect(HttpStatus.CONFLICT)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            error: 'DUPLICATE_USER_CONNECTION',
            message:
              `A user connection from id: ${firstUser.user.id} ` +
              `to id: ${createUserConnectionReq.to_user_id} already exists`,
          }),
        );
    });

    it('creates a new connection with opposite becomes mutual', async () => {
      const secondUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: 2,
        toUserId: 1,
      });
      await prismaService.userConnection.create({
        data: secondUserConnection,
      });

      return request(app.getHttpServer())
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .send(factories.createUserConnectionRequest.build())
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            from_user: {
              id: 1,
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
            },
            to_user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
            },
            is_mutual: true,
          }),
        );
    });
  });

  describe('/user-connections/by-users (GET)', () => {
    beforeAll(async () => {
      const firstUserConnection = factories.userConnectionEntity.build();
      const secondUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: 2,
        toUserId: 1,
      });
      await prismaService.userConnection.createMany({
        data: [firstUserConnection, secondUserConnection],
      });
      await prismaService.userConnection.update({
        where: { id: firstUserConnection.id },
        data: {
          oppositeUserConnectionId: secondUserConnection.id,
        },
      });
      await prismaService.userConnection.update({
        where: { id: secondUserConnection.id },
        data: {
          oppositeUserConnectionId: firstUserConnection.id,
        },
      });
    });
    afterAll(async () => {
      await prismaService.userConnection.deleteMany();
    });

    it('fetches user connection by users', async () => {
      return request(app.getHttpServer())
        .get('/user-connections/by-users?from_user_id=1&to_user_id=2')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            from_user: {
              id: 1,
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
            },
            id: 1,
            to_user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
            },
            is_mutual: true,
          }),
        );
    });

    it('returns not found', async () => {
      await prismaService.user.createMany({
        data: [
          factories.userEntity.build({
            id: 999,
            email: 'TEST_USER_999@EMAIL.COM',
            userHandle: 'test-user_999#999',
            username: 'test-user-999',
          }),
          factories.userEntity.build({
            id: 998,
            email: 'TEST_USER_998@EMAIL.COM',
            userHandle: 'test-user_998#998',
            username: 'test-user-998',
          }),
        ],
      });
      return request(app.getHttpServer())
        .get('/user-connections/by-users?from_user_id=999&to_user_id=998')
        .expect(404)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            error: 'USER_CONNECTION_NOT_FOUND',
            message: 'User connection not found',
          }),
        );
    });
  });

  describe('/user-connections/:id (GET)', () => {
    beforeAll(async () => {
      const firstUserConnection = factories.userConnectionEntity.build();
      const secondUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: 2,
        toUserId: 1,
      });
      await prismaService.userConnection.createMany({
        data: [firstUserConnection, secondUserConnection],
      });
      await prismaService.userConnection.update({
        where: { id: firstUserConnection.id },
        data: { oppositeUserConnectionId: secondUserConnection.id },
      });
      await prismaService.userConnection.update({
        where: { id: secondUserConnection.id },
        data: { oppositeUserConnectionId: firstUserConnection.id },
      });
    });
    afterAll(async () => {
      await prismaService.userConnection.deleteMany();
    });

    it('fetches user connection', async () => {
      return request(app.getHttpServer())
        .get('/user-connections/1')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            from_user: {
              id: 1,
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
            },
            id: 1,
            to_user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
            },
            is_mutual: true,
          }),
        );
    });

    it('returns not found', async () => {
      return request(app.getHttpServer())
        .get('/user-connections/999')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            error: 'USER_CONNECTION_NOT_FOUND',
            message: 'User connection with id: 999 not found',
          }),
        );
    });
  });

  describe('/user-connections/:id (DELETE)', () => {
    const firstUserConnection = factories.userConnectionEntity.build();

    beforeEach(async () => {
      await prismaService.userConnection.create({
        data: firstUserConnection,
      });
    });

    afterEach(async () => {
      await prismaService.userConnection.deleteMany();
    });

    it('deletes user connection', async () => {
      return request(app.getHttpServer())
        .delete('/user-connections/1')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toStrictEqual({}));
    });

    it('deleting user connection removes mutual status', async () => {
      const secondUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: 2,
        toUserId: 1,
      });
      await prismaService.userConnection.create({
        data: secondUserConnection,
      });
      await prismaService.userConnection.update({
        where: { id: firstUserConnection.id },
        data: {
          oppositeUserConnectionId: secondUserConnection.id,
        },
      });
      await prismaService.userConnection.update({
        where: { id: secondUserConnection.id },
        data: {
          oppositeUserConnectionId: firstUserConnection.id,
        },
      });

      await request(app.getHttpServer())
        .delete('/user-connections/1')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toStrictEqual({}));

      return request(app.getHttpServer())
        .get('/user-connections/2')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            from_user: {
              id: 2,
              user_handle: 'test-user-2#2',
              username: 'test-user-2',
              bio: null,
              display_name: null,
            },
            id: 2,
            to_user: {
              id: 1,
              user_handle: 'test-user#1',
              username: 'test-user',
              bio: null,
              display_name: null,
            },
            is_mutual: false,
          }),
        );
    });
  });

  describe('/user-connections/my-connections (GET)', () => {
    afterEach(async () => {
      await prismaService.userConnection.deleteMany();
    });

    it('fetches my mutual connections', async () => {
      const firstUserConnection = factories.userConnectionEntity.build();
      const secondUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: 2,
        toUserId: 1,
      });
      await prismaService.userConnection.createMany({
        data: [firstUserConnection, secondUserConnection],
      });
      await prismaService.userConnection.update({
        where: { id: firstUserConnection.id },
        data: { oppositeUserConnectionId: secondUserConnection.id },
      });
      await prismaService.userConnection.update({
        where: { id: secondUserConnection.id },
        data: { oppositeUserConnectionId: firstUserConnection.id },
      });

      return request(app.getHttpServer())
        .get('/user-connections/my-connections?connection_type=mutual')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            total_count: 1,
            user_connections: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                from_user: {
                  id: 1,
                  user_handle: 'test-user#1',
                  username: 'test-user',
                  bio: null,
                  display_name: null,
                },
                id: expect.any(Number),
                to_user: {
                  id: 2,
                  user_handle: 'test-user-2#2',
                  username: 'test-user-2',
                  bio: null,
                  display_name: null,
                },
              },
            ],
          }),
        );
    });

    it('fetches my follower connections', async () => {
      const secondUserConnection = factories.userConnectionEntity.build({
        id: 2,
        fromUserId: 2,
        toUserId: 1,
      });
      await prismaService.userConnection.create({ data: secondUserConnection });

      return request(app.getHttpServer())
        .get('/user-connections/my-connections?connection_type=follower')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            total_count: 1,
            user_connections: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                to_user: {
                  id: 1,
                  user_handle: 'test-user#1',
                  username: 'test-user',
                  bio: null,
                  display_name: null,
                },
                id: expect.any(Number),
                from_user: {
                  id: 2,
                  user_handle: 'test-user-2#2',
                  username: 'test-user-2',
                  bio: null,
                  display_name: null,
                },
              },
            ],
          }),
        );
    });

    it('fetches my follow connections', async () => {
      const firstUserConnection = factories.userConnectionEntity.build();
      await prismaService.userConnection.create({ data: firstUserConnection });

      return request(app.getHttpServer())
        .get('/user-connections/my-connections?connection_type=following')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            total_count: 1,
            user_connections: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                from_user: {
                  id: 1,
                  user_handle: 'test-user#1',
                  username: 'test-user',
                  bio: null,
                  display_name: null,
                },
                id: expect.any(Number),
                to_user: {
                  id: 2,
                  user_handle: 'test-user-2#2',
                  username: 'test-user-2',
                  bio: null,
                  display_name: null,
                },
              },
            ],
          }),
        );
    });
  });
});
