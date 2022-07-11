import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import * as request from 'supertest';

import { User } from 'src/users/entities/user.entity';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import { createUsersAndLoginFixture } from './fixtures/create-users-and-login-fixture';

describe('UserConnectionsController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userRepository: Repository<User>;
  let userConnectionRepository: Repository<UserConnection>;
  let platformRepository: Repository<Platform>;
  let platformUserRepository: Repository<PlatformUser>;
  let platformCategoryRepository: Repository<PlatformCategory>;

  let firstUserAccessToken: string;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    connection = app.get(Connection);
    userRepository = connection.getRepository(User);
    userConnectionRepository = connection.getRepository(UserConnection);
    platformRepository = connection.getRepository(Platform);
    platformUserRepository = connection.getRepository(PlatformUser);
    platformCategoryRepository = connection.getRepository(PlatformCategory);

    await connection.synchronize(true);

    const [{ accessToken }] = await createUsersAndLoginFixture(app);
    firstUserAccessToken = accessToken;

    await platformCategoryRepository.save(
      factories.onePlatformCategory.build(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/user-connections (POST)', () => {
    afterEach(async () => {
      await userConnectionRepository.delete({});
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('creates a new connection', async () => {
      return request(app.getHttpServer())
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .send(factories.createUserConnectionRequestDto.build())
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            from_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            to_user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [],
            is_mutual: false,
          }),
        );
    });

    it('creates a new connection with platform', async () => {
      await platformRepository.save(factories.onePlatform.build());
      await platformUserRepository.save(factories.onePlatformUser.build());

      return request(app.getHttpServer())
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .send(
          factories.createUserConnectionRequestDto.build({ platform_id: 1 }),
        )
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            from_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            to_user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                is_verified: true,
                name: 'TEST_PLATFORM',
                name_handle: 'TEST_PLATFORM#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
              },
            ],
            is_mutual: false,
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
        .post('/user-connections')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .send(factories.createUserConnectionRequestDto.build())
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            from_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            to_user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [],
            is_mutual: true,
          }),
        );
    });
  });

  describe('/user-connections/by-users (GET)', () => {
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
        .get('/user-connections/by-users?from_user_id=1&to_user_id=2')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            from_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            id: 1,
            platforms: [],
            to_user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
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
        .get('/user-connections/1')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            from_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            id: 1,
            platforms: [],
            to_user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
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
    beforeEach(async () => {
      await userConnectionRepository.save(factories.oneUserConnection.build());
    });

    afterEach(async () => {
      await userConnectionRepository.delete({});
    });

    it('deletes user connection', async () => {
      return request(app.getHttpServer())
        .delete('/user-connections/1')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .expect(HttpStatus.OK)
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
        .delete('/user-connections/1')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
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
              user_handle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            id: 2,
            platforms: [],
            to_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
          }),
        );
    });
  });

  describe('/user-connections/:id/platforms (POST)', () => {
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

      await request(app.getHttpServer())
        .post('/user-connections/1/platforms')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .send(factories.postPlatformToUserConnectionRequestDto.build())
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            id: 1,
            created_at: expect.any(String),
            updated_at: expect.any(String),
            from_user: {
              id: 1,
              user_handle: 'TEST_USER#1',
              username: 'TEST_USER',
            },
            to_user: {
              id: 2,
              user_handle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
            platforms: [
              {
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
            ],
          }),
        );
    });
  });

  describe('/user-connections/:id/platforms (DELETE)', () => {
    beforeEach(async () => {
      await userConnectionRepository.save(factories.oneUserConnection.build());
    });

    afterEach(async () => {
      await userConnectionRepository.delete({});
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('deletes a platform from existing connection', async () => {
      await platformRepository.save(factories.onePlatform.build());
      await platformUserRepository.save(factories.onePlatformUser.build());

      return request(app.getHttpServer())
        .delete('/user-connections/1/platforms/1')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toStrictEqual({}));
    });
  });

  describe('/user-connections/my-connections (GET)', () => {
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
        .get('/user-connections/my-connections?connection_type=mutual')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
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
                  user_handle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: expect.any(Number),
                platforms: [],
                to_user: {
                  id: 2,
                  user_handle: 'TEST_USER_2#2',
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
      await userConnectionRepository.save(secondUserConnection);

      return request(app.getHttpServer())
        .get('/user-connections/my-connections?connection_type=follower')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
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
                  user_handle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: expect.any(Number),
                platforms: [],
                from_user: {
                  id: 2,
                  user_handle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
            ],
          }),
        );
    });

    it('fetches my follow connections', async () => {
      const firstUserConnection = factories.oneUserConnection.build();
      await userConnectionRepository.save(firstUserConnection);

      return request(app.getHttpServer())
        .get('/user-connections/my-connections?connection_type=following')
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
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
                  user_handle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                id: expect.any(Number),
                platforms: [],
                to_user: {
                  id: 2,
                  user_handle: 'TEST_USER_2#2',
                  username: 'TEST_USER_2',
                },
              },
            ],
          }),
        );
    });

    it('fetches my follow connections for a platform', async () => {
      const thirdUser = factories.oneUser.build({
        id: 3,
        username: 'TEST_USER_3',
        userHandle: 'TEST_USER_3#3',
        email: 'TEST_USER_3@EMAIL.COM',
      });
      const onePlatform = factories.onePlatform.build();
      await userRepository.save(thirdUser);
      await platformRepository.save(onePlatform);
      const firstUserConnection = factories.oneUserConnection.build({
        platforms: [],
      });
      const secondUserConnection = factories.oneUserConnection.build({
        id: 2,
        toUser: thirdUser,
        platforms: [factories.onePlatform.build()],
      });
      await userConnectionRepository.save([
        firstUserConnection,
        secondUserConnection,
      ]);

      return request(app.getHttpServer())
        .get(
          '/user-connections/my-connections?connection_type=following&platform_id=1',
        )
        .set('Authorization', `Bearer ${firstUserAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toStrictEqual({
            total_count: 1,
            user_connections: [
              {
                id: expect.any(Number),
                created_at: expect.any(String),
                updated_at: expect.any(String),
                from_user: {
                  id: 1,
                  user_handle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
                platforms: [
                  {
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                    id: 1,
                    is_verified: true,
                    name: 'TEST_PLATFORM',
                    name_handle: 'TEST_PLATFORM#1',
                  },
                ],
                to_user: {
                  id: 3,
                  user_handle: 'TEST_USER_3#3',
                  username: 'TEST_USER_3',
                },
              },
            ],
          }),
        );
    });
  });
});
