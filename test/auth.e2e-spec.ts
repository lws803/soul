import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { UserRole } from 'src/roles/role.enum';

import createAppFixture from './fixtures/create-app-fixture';
import { createUsersAndLoginFixture } from './fixtures/create-users-and-login-fixture';

import * as factories from '../factories';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    const connection = app.get(Connection);
    await connection.synchronize(true);

    userRepository = connection.getRepository(User);
    refreshTokenRepository = connection.getRepository(RefreshToken);
    platformUserRepository = connection.getRepository(PlatformUser);
    platformRepository = connection.getRepository(Platform);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    let userAccount: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    beforeAll(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;

      const platform = await platformRepository.save(
        factories.onePlatform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          platform,
          user: userAccount.user,
        }),
      );
    });

    afterAll(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
      await userRepository.delete({});
    });

    it('logs in successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' })
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
        );
      const user = await userRepository.findOne({
        email: 'TEST_USER@EMAIL.COM',
      });
      expect(
        await refreshTokenRepository.findOne({ user }),
      ).not.toBeUndefined();
    });

    it('logs in successfully for platform', async () => {
      const codeResp = await request(app.getHttpServer())
        .post('/auth/code?platformId=1&callback=https://www.example.com')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      await request(app.getHttpServer())
        .post(
          `/auth/verify?code=${codeResp.body.code}&callback=https://www.example.com`,
        )
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            platformId: 1,
            roles: [UserRole.ADMIN, UserRole.MEMBER],
          }),
        );
    });

    it('fails to login with wrong credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'WRONG_PASSWORD' })
        .expect(401)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'UNAUTHORIZED_USER',
            message: 'Incorrect username or password.',
          }),
        );
    });
  });

  describe('/auth/refresh', () => {
    let userAccount: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };

    beforeAll(async () => {
      const [firstUser] = await createUsersAndLoginFixture(app);
      userAccount = firstUser;

      const platform = await platformRepository.save(
        factories.onePlatform.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          platform,
          user: userAccount.user,
        }),
      );
    });

    afterAll(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
      await userRepository.delete({});
    });

    it('refreshes token successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: userAccount.refreshToken })
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            accessToken: expect.any(String),
          }),
        );
    });

    it('refreshes token for platform', async () => {
      const codeResp = await request(app.getHttpServer())
        .post('/auth/code?platformId=1&callback=https://www.example.com')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const resp = await request(app.getHttpServer()).post(
        `/auth/verify?code=${codeResp.body.code}&callback=https://www.example.com`,
      );

      const { refreshToken } = resp.body;

      await request(app.getHttpServer())
        .post('/auth/refresh?platformId=1')
        .send({ refreshToken })
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            accessToken: expect.any(String),
            platformId: 1,
            roles: [UserRole.ADMIN, UserRole.MEMBER],
          }),
        );
    });

    it('refreshes token for platform without specifying platform id', async () => {
      const codeResp = await request(app.getHttpServer())
        .post('/auth/code?platformId=1&callback=https://www.example.com')
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const resp = await request(app.getHttpServer()).post(
        `/auth/verify?code=${codeResp.body.code}&callback=https://www.example.com`,
      );

      const { refreshToken } = resp.body;

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'INVALID_TOKEN',
            message: 'Refresh token is for a platform with id: 1.',
          }),
        );
    });

    it('fails when refreshing with access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: userAccount.accessToken })
        .expect(401)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'INVALID_TOKEN',
            message:
              'Access token used in place of refresh token, please try again.',
          }),
        );
    });

    it('fails when refresh token is invalid or corrupted', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: userAccount.refreshToken + 'INVALID' })
        .expect(401)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'INVALID_TOKEN',
            message: 'Invalid token used.',
          }),
        );
    });
  });
});
