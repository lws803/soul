import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import * as request from 'supertest';

import { UserConnection } from 'src/user-connections/entities/user-connection.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { UserRole } from 'src/roles/role.enum';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';

describe('ReputationController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userConnectionRepository: Repository<UserConnection>;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;
  let platformCategoryRepository: Repository<PlatformCategory>;
  let userAccount: UserAccount;
  let secondUserAccount: UserAccount;
  let thirdUserAccount: UserAccount;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    connection = app.get(Connection);
    await connection.synchronize(true);

    userConnectionRepository = connection.getRepository(UserConnection);
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

  describe('/:userId (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.platform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          user: userAccount.user,
          platform,
          roles: [UserRole.Banned],
        }),
      );
      await userConnectionRepository.save(
        factories.oneUserConnection.build({
          toUser: userAccount.user,
          fromUser: secondUserAccount.user,
        }),
      );
      await userConnectionRepository.save(
        factories.oneUserConnection.build({
          id: 2,
          toUser: userAccount.user,
          fromUser: thirdUserAccount.user,
        }),
      );
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
      await userConnectionRepository.delete({});
    });

    it('should return a user reputation', async () => {
      return request(app.getHttpServer())
        .get('/reputation/1')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            user_id: userAccount.user.id,
            reputation: 1,
          });
        });
    });

    it('should return 404 when user does not exist', async () => {
      return request(app.getHttpServer())
        .get('/reputation/999')
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
});
