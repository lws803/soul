import { INestApplication } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import * as request from 'supertest';

import { User } from 'src/users/entities/user.entity';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';

import createAppFixture from './create-app-fixture';
import { createUsersAndLogin } from './create-users-and-login';

import * as factories from '../factories';

describe('UserConnectionsController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userRepository: Repository<User>;
  let userConnectionRepository: Repository<UserConnection>;
  let platformRepository: Repository<Platform>;
  let platformUserRepository: Repository<PlatformUser>;

  let firstUserAccessToken: string;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();

    connection = app.get(Connection);
    userRepository = connection.getRepository(User);
    userConnectionRepository = connection.getRepository(UserConnection);
    platformRepository = connection.getRepository(Platform);
    platformUserRepository = connection.getRepository(PlatformUser);

    await connection.synchronize(true);

    const {
      firstUser: { accessToken },
    } = await createUsersAndLogin(app);
    firstUserAccessToken = accessToken;
  });

  afterAll((done) => {
    app.close().then(done);
  });

  describe('/user_connections (POST)', () => {
    afterEach(async () => {
      await userConnectionRepository.delete({});
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('creates a new connection', async () => {
      return request(app.getHttpServer())
        .post('/user_connections')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .send(factories.createUserConnectionDto.build())
        .expect(201)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(Number),
            fromUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            toUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [],
            isMutual: false,
          }),
        );
    });

    it('creates a new connection with platform', async () => {
      await platformRepository.save(factories.onePlatform.build());
      await platformUserRepository.save(factories.onePlatformUser.build());

      return request(app.getHttpServer())
        .post('/user_connections')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .send(factories.createUserConnectionDto.build({ platformId: 1 }))
        .expect(201)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(Number),
            fromUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            toUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                id: expect.any(Number),
                hostUrl: 'TEST_HOST_URL',
                name: 'TEST_PLATFORM',
                nameHandle: 'TEST_PLATFORM#1',
              },
            ],
            isMutual: false,
          }),
        );
    });

    it('creates a new connection with opposite becomes mutual', async () => {
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        fromUser: factories.oneUser.build({
          id: 2,
          email: 'TEST_USER_2@EMAIL.COM',
        }),
        toUser: factories.oneUser.build(),
      });
      await userConnectionRepository.save(secondUserConnection);
      await userConnectionRepository.update(
        { id: 1 },
        { mutualConnection: secondUserConnection },
      );

      return request(app.getHttpServer())
        .post('/user_connections')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .send(factories.createUserConnectionDto.build())
        .expect(201)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(Number),
            fromUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            toUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [],
            isMutual: true,
          }),
        );
    });
  });

  describe('/user_connections (GET)', () => {
    beforeAll(async () => {
      await userConnectionRepository.save([
        factories.oneUserConnection.build(),
        factories.oneUserConnection.build({
          id: 2,
          fromUser: factories.oneUser.build({
            id: 2,
            email: 'TEST_USER_2@EMAIL.COM',
          }),
          toUser: factories.oneUser.build(),
        }),
      ]);
    });
    afterAll(async () => {
      await userConnectionRepository.delete({});
    });

    it('fetches all user connections', async () => {
      return request(app.getHttpServer())
        .get('/user_connections')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            totalCount: 2,
            userConnections: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                fromUser: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: 1,
                platforms: [],
                toUser: {
                  id: 2,
                  userHandle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                fromUser: {
                  id: 2,
                  userHandle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
                id: 2,
                platforms: [],
                toUser: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
              },
            ],
          }),
        );
    });

    it('fetches all user connections with pagination', async () => {
      return request(app.getHttpServer())
        .get('/user_connections?page=1&numItemsPerPage=1')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            totalCount: 2,
            userConnections: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                fromUser: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: 1,
                platforms: [],
                toUser: {
                  id: 2,
                  userHandle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
            ],
          }),
        );
    });
  });

  describe('/user_connections/by_users (GET)', () => {
    beforeAll(async () => {
      const firstUserConnection = factories.oneUserConnection.build();
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        fromUser: factories.oneUser.build({
          id: 2,
          email: 'TEST_USER_2@EMAIL.COM',
        }),
        toUser: factories.oneUser.build(),
      });
      await userConnectionRepository.save([
        firstUserConnection,
        secondUserConnection,
      ]);
      await userConnectionRepository.save([
        { ...firstUserConnection, mutualConnection: secondUserConnection },
        { ...secondUserConnection, mutualConnection: firstUserConnection },
      ]);
    });
    afterAll(async () => {
      await userConnectionRepository.delete({});
    });

    it('fetches user connection by users', async () => {
      return request(app.getHttpServer())
        .get('/user_connections/by_users?fromUserId=1&toUserId=2')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            fromUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            id: 1,
            platforms: [],
            toUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('returns not found', async () => {
      await userRepository.save([
        factories.oneUser.build({
          id: 999,
          email: 'TEST_USER_999@EMAIL.COM',
          userHandle: 'TEST_USER_999#999',
        }),
        factories.oneUser.build({
          id: 998,
          email: 'TEST_USER_998@EMAIL.COM',
          userHandle: 'TEST_USER_998#998',
        }),
      ]);
      return request(app.getHttpServer())
        .get('/user_connections/by_users?fromUserId=999&toUserId=998')
        .expect(404)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            error: 'USER_CONNECTION_NOT_FOUND',
            message: 'User connection not found',
          }),
        );
    });
  });

  describe('/user_connections/:id (GET)', () => {
    beforeAll(async () => {
      const firstUserConnection = factories.oneUserConnection.build();
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        fromUser: factories.oneUser.build({
          id: 2,
          email: 'TEST_USER_2@EMAIL.COM',
        }),
        toUser: factories.oneUser.build(),
      });
      await userConnectionRepository.save([
        firstUserConnection,
        secondUserConnection,
      ]);
      await userConnectionRepository.save([
        { ...firstUserConnection, mutualConnection: secondUserConnection },
        { ...secondUserConnection, mutualConnection: firstUserConnection },
      ]);
    });
    afterAll(async () => {
      await userConnectionRepository.delete({});
    });

    it('fetches user connection', async () => {
      return request(app.getHttpServer())
        .get('/user_connections/1')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            fromUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            id: 1,
            platforms: [],
            toUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('returns not found', async () => {
      return request(app.getHttpServer())
        .get('/user_connections/999')
        .expect(404)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            error: 'USER_CONNECTION_NOT_FOUND',
            message: 'User connection with id: 999 not found',
          }),
        );
    });
  });

  describe('/user_connections/:id (DELETE)', () => {
    beforeEach(async () => {
      await userConnectionRepository.save(factories.oneUserConnection.build());
    });

    afterEach(async () => {
      await userConnectionRepository.delete({});
    });

    it('deletes user connection', async () => {
      return request(app.getHttpServer())
        .delete('/user_connections/1')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual({}));
    });

    it('deleting user connection removes mutual status', async () => {
      const firstUserConnection = factories.oneUserConnection.build();
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        fromUser: factories.oneUser.build({
          id: 2,
          email: 'TEST_USER_2@EMAIL.COM',
        }),
        toUser: factories.oneUser.build(),
      });
      await userConnectionRepository.save([
        firstUserConnection,
        secondUserConnection,
      ]);
      await userConnectionRepository.save([
        { ...firstUserConnection, mutualConnection: secondUserConnection },
        { ...secondUserConnection, mutualConnection: firstUserConnection },
      ]);

      await request(app.getHttpServer())
        .delete('/user_connections/1')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual({}));

      return request(app.getHttpServer())
        .get('/user_connections/2')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            fromUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            id: 2,
            platforms: [],
            toUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
          }),
        );
    });
  });

  describe('/user_connections/:id/platforms (POST)', () => {
    beforeEach(async () => {
      await userConnectionRepository.save(factories.oneUserConnection.build());
    });

    afterEach(async () => {
      await userConnectionRepository.delete({});
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('adds a new platform to the existing connection', async () => {
      await platformRepository.save(factories.onePlatform.build());
      await platformUserRepository.save(factories.onePlatformUser.build());

      return request(app.getHttpServer())
        .post('/user_connections/1/platforms')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .send(factories.postPlatformToUserConnectionDto.build())
        .expect(201)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            id: 1,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            fromUser: {
              id: 1,
              userHandle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            toUser: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: 1,
                name: 'TEST_PLATFORM',
                nameHandle: 'TEST_PLATFORM#1',
              },
            ],
          }),
        );
    });
  });

  describe('/user_connections/:id/platforms (POST)', () => {
    beforeEach(async () => {
      await userConnectionRepository.save(factories.oneUserConnection.build());
    });

    afterEach(async () => {
      await userConnectionRepository.delete({});
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('adds a new platform to the existing connection', async () => {
      await platformRepository.save(factories.onePlatform.build());
      await platformUserRepository.save(factories.onePlatformUser.build());

      return request(app.getHttpServer())
        .delete('/user_connections/1/platforms/1')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toStrictEqual({}));
    });
  });

  describe('/user_connections/my_connections (GET)', () => {
    afterEach(async () => {
      await userConnectionRepository.delete({});
    });

    it('fetches my mutual connections', async () => {
      const firstUserConnection = factories.oneUserConnection.build();
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        fromUser: factories.oneUser.build({
          id: 2,
          email: 'TEST_USER_2@EMAIL.COM',
        }),
        toUser: factories.oneUser.build(),
      });
      await userConnectionRepository.save([
        firstUserConnection,
        secondUserConnection,
      ]);
      await userConnectionRepository.save([
        { ...firstUserConnection, mutualConnection: secondUserConnection },
        { ...secondUserConnection, mutualConnection: firstUserConnection },
      ]);

      return request(app.getHttpServer())
        .get('/user_connections/my_connections?connectionType=mutual')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            totalCount: 1,
            userConnections: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                fromUser: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: expect.any(Number),
                platforms: [],
                toUser: {
                  id: 2,
                  userHandle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
            ],
          }),
        );
    });

    it('fetches my follower connections', async () => {
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        fromUser: factories.oneUser.build({
          id: 2,
          email: 'TEST_USER_2@EMAIL.COM',
        }),
        toUser: factories.oneUser.build(),
      });
      await userConnectionRepository.save([secondUserConnection]);

      return request(app.getHttpServer())
        .get('/user_connections/my_connections?connectionType=follower')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            totalCount: 1,
            userConnections: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                toUser: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: expect.any(Number),
                platforms: [],
                fromUser: {
                  id: 2,
                  userHandle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
            ],
          }),
        );
    });

    it('fetches my follow connections', async () => {
      const firstUserConnection = factories.oneUserConnection.build();
      await userConnectionRepository.save([firstUserConnection]);

      return request(app.getHttpServer())
        .get('/user_connections/my_connections?connectionType=follow')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            totalCount: 1,
            userConnections: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                fromUser: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: expect.any(Number),
                platforms: [],
                toUser: {
                  id: 2,
                  userHandle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
            ],
          }),
        );
    });
  });
});
