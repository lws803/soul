import { HttpStatus, INestApplication } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import * as request from 'supertest';

import { Platform } from 'src/platforms/entities/platform.entity';
import { UserRole } from 'src/roles/role.enum';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';
import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../factories';

import createAppFixture from './fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from './fixtures/create-users-and-login-fixture';

describe('ReputationController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let platformRepository: Repository<Platform>;
  let platformCategoryRepository: Repository<PlatformCategory>;
  let userAccount: UserAccount;
  let secondUserAccount: UserAccount;
  let thirdUserAccount: UserAccount;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    connection = app.get(Connection);
    await connection.synchronize(true);

    prismaService = app.get<PrismaService>(PrismaService);
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

  describe('/:userId (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );

      await prismaService.platformUser.create({
        data: {
          userId: userAccount.user.id,
          platformId: platform.id,
          roles: [UserRole.Banned],
          profileUrl: 'PROFILE_URL',
        },
      });

      await prismaService.userConnection.createMany({
        data: [
          factories.userConnectionEntity.build({
            toUserId: userAccount.user.id,
            fromUserId: secondUserAccount.user.id,
          }),
          factories.userConnectionEntity.build({
            id: 2,
            toUserId: userAccount.user.id,
            fromUserId: thirdUserAccount.user.id,
          }),
        ],
      });
    });

    afterEach(async () => {
      await prismaService.platformUser.deleteMany();
      await platformRepository.delete({});
      await prismaService.userConnection.deleteMany();
    });

    it('should return a user reputation', async () => {
      return request(app.getHttpServer())
        .get('/reputation/1')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            user: {
              id: userAccount.user.id,
              user_handle: userAccount.user.userHandle,
              username: userAccount.user.username,
              bio: null,
              display_name: null,
            },
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
