import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';
import * as sha256 from 'crypto-js/sha256';
import base64url from 'base64url';

import { UserRole } from 'src/roles/role.enum';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';
import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../../factories';
import createAppFixture from '../fixtures/create-app-fixture';
import {
  createUsersAndLoginFixture,
  UserAccount,
} from '../fixtures/create-users-and-login-fixture';

describe('PlatformsController (e2e)', () => {
  let app: INestApplication;
  let platformRepository: Repository<Platform>;
  let platformCategoryRepository: Repository<PlatformCategory>;
  let prismaService: PrismaService;

  let userAccount: UserAccount;
  let secondUserAccount: UserAccount;

  const codeVerifier = 'CODE_VERIFIER';
  const codeChallenge = base64url(sha256(codeVerifier).toString(), 'hex');

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();
    app.useLogger(false);

    const connection = app.get(Connection);
    await connection.synchronize(true);

    platformRepository = connection.getRepository(Platform);
    platformCategoryRepository = connection.getRepository(PlatformCategory);
    prismaService = app.get<PrismaService>(PrismaService);

    const [firstUser, secondUser] = await createUsersAndLoginFixture(app);
    userAccount = firstUser;
    secondUserAccount = secondUser;

    await platformCategoryRepository.save(
      factories.platformCategoryEntity.build(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/platforms (POST)', () => {
    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('creates a new platform', async () => {
      const createPlatformDto = factories.createPlatformRequest.build({
        redirect_uris: ['https://example.com/redirect'],
      });

      await request(app.getHttpServer())
        .post('/platforms')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(createPlatformDto)
        .expect(HttpStatus.CREATED)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            name_handle: expect.any(String),
            redirect_uris: ['https://example.com/redirect'],
            name: 'TEST_PLATFORM',
            is_verified: false,
            activity_webhook_uri: 'ACTIVITY_WEBHOOK_URI',
            client_secret: null,
            homepage_url: 'HOMEPAGE_URL',
          }),
        );

      const platformUser = await prismaService.platformUser.findFirst({
        where: { userId: userAccount.user.id },
      });
      expect(platformUser).toBeDefined();
      expect(platformUser.roles).toEqual([UserRole.Admin, UserRole.Member]);
    });

    it('throws when user is not logged in', async () => {
      const createPlatformDto = factories.createPlatformRequest.build();

      await request(app.getHttpServer())
        .post('/platforms')
        .send(createPlatformDto)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'UNAUTHORIZED_ERROR',
            message: 'Unauthorized',
          }),
        );
    });

    it('throws when user has created too many platforms', async () => {
      const createPlatformDto = factories.createPlatformRequest.build({
        redirect_uris: ['https://example.com/redirect'],
      });

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/platforms')
          .set('Authorization', `Bearer ${userAccount.accessToken}`)
          .send(createPlatformDto)
          .expect(HttpStatus.CREATED);
      }

      await request(app.getHttpServer())
        .post('/platforms')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send(createPlatformDto)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'MAX_ADMIN_ROLES_EXCEEDED_PER_USER',
            message: "Users can't hold more than 5 admin roles",
          }),
        );
    });
  });

  describe('/platforms (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save([
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
        factories.platformEntity.build({
          id: 2,
          name: 'TEST_PLATFORM_2',
          nameHandle: 'test_platform_2#2',
          isVerified: false,
          category: null,
        }),
      ]);
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches all platforms', async () => {
      await request(app.getHttpServer())
        .get('/platforms')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                is_verified: false,
                name_handle: 'test_platform_2#2',
                category: null,
                homepage_url: 'HOMEPAGE_URL',
              },
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_1',
                is_verified: true,
                name_handle: 'test_platform_1#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 2,
          }),
        );
    });

    it('paginates correctly', async () => {
      await request(app.getHttpServer())
        .get('/platforms?num_items_per_page=1&page=1')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                name_handle: 'test_platform_2#2',
                is_verified: false,
                category: null,
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 2,
          }),
        );
    });

    it('fetches all platforms with is_verified filter', async () => {
      await request(app.getHttpServer())
        .get('/platforms?is_verified=true')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_1',
                is_verified: true,
                name_handle: 'test_platform_1#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 1,
          }),
        );
    });

    it('fetches all platforms with category filter', async () => {
      await request(app.getHttpServer())
        .get('/platforms?category=CATEGORY')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_1',
                is_verified: true,
                name_handle: 'test_platform_1#1',
                category: {
                  id: 1,
                  name: 'CATEGORY',
                },
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 1,
          }),
        );
    });

    it('throws unknown category error when category does not exist', async () => {
      await request(app.getHttpServer())
        .get('/platforms?category=UNKNOWN_CATEGORY')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PLATFORM_CATEGORY_NOT_FOUND',
            message:
              'The category with name: UNKNOWN_CATEGORY was not found, please try again.',
          }),
        );
    });

    it('fetches all platforms with full text search', async () => {
      await request(app.getHttpServer())
        .get('/platforms?q=TEST_PLATFORM_2')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                is_verified: false,
                name_handle: 'test_platform_2#2',
                category: null,
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 1,
          }),
        );
    });
  });

  describe('/platforms/my-platforms (GET)', () => {
    beforeAll(async () => {
      const platformOne = factories.platformEntity.build({
        redirectUris: ['https://www.example.com'],
      });
      const platformTwo = factories.platformEntity.build({
        id: 2,
        name: 'TEST_PLATFORM_2',
        nameHandle: 'test_platform_2#2',
        isVerified: false,
        category: null,
      });
      const platformThree = factories.platformEntity.build({
        id: 3,
        name: 'TEST_PLATFORM_3',
        nameHandle: 'TEST_PLATFORM_3#3',
        isVerified: false,
        category: null,
      });

      await platformRepository.save([platformOne, platformTwo, platformThree]);

      await prismaService.platformUser.createMany({
        data: [
          factories.platformUserEntity.build({
            id: 1,
            userId: userAccount.user.id,
            roles: [UserRole.Admin, UserRole.Member],
            platformId: platformOne.id,
          }),
          factories.platformUserEntity.build({
            id: 2,
            userId: userAccount.user.id,
            roles: [UserRole.Member],
            platformId: platformTwo.id,
          }),
          factories.platformUserEntity.build({
            id: 3,
            userId: secondUserAccount.user.id,
            roles: [UserRole.Member],
            platformId: platformThree.id,
          }),
        ],
      });
    });

    afterAll(async () => {
      await prismaService.platformUser.deleteMany();
      await platformRepository.delete({});
    });

    it('fetches my platforms', async () => {
      await request(app.getHttpServer())
        .get('/platforms/my-platforms')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                is_verified: false,
                name_handle: 'test_platform_2#2',
                category: null,
                homepage_url: 'HOMEPAGE_URL',
              },
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_1',
                is_verified: true,
                name_handle: 'test_platform_1#1',
                category: { id: 1, name: 'CATEGORY' },
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 2,
          }),
        );
    });

    it('paginates correctly', async () => {
      await request(app.getHttpServer())
        .get('/platforms/my-platforms/?num_items_per_page=1&page=1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                is_verified: false,
                name_handle: 'test_platform_2#2',
                category: null,
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 2,
          }),
        );
    });

    it('fetches my platforms with roles filter', async () => {
      await request(app.getHttpServer())
        .get('/platforms/my-platforms/?role=admin')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                created_at: expect.any(String),
                updated_at: expect.any(String),
                id: 1,
                name: 'TEST_PLATFORM_1',
                is_verified: true,
                name_handle: 'test_platform_1#1',
                category: { id: 1, name: 'CATEGORY' },
                homepage_url: 'HOMEPAGE_URL',
              },
            ],
            total_count: 1,
          }),
        );
    });
  });

  describe('/platforms/:platformId (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches a platform by id', async () => {
      await request(app.getHttpServer())
        .get('/platforms/1')
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            name: 'TEST_PLATFORM_1',
            name_handle: 'test_platform_1#1',
            is_verified: true,
            category: {
              id: 1,
              name: 'CATEGORY',
            },
            homepage_url: 'HOMEPAGE_URL',
          }),
        );
    });

    it('throws not found', async () => {
      await request(app.getHttpServer())
        .get('/platforms/999')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PLATFORM_NOT_FOUND',
            message:
              'The platform with id: 999 was not found, please try again.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/full (GET)', () => {
    beforeAll(async () => {
      const platformOne = factories.platformEntity.build({
        redirectUris: ['https://www.example.com'],
      });
      const adminPlatform = factories.platformEntity.build({
        id: 2,
        name: 'ADMIN_PLATFORM',
        nameHandle: 'admin_platform#2',
        isVerified: false,
        category: null,
        redirectUris: ['https://www.example.com'],
      });

      await platformRepository.save([platformOne, adminPlatform]);

      await prismaService.platformUser.createMany({
        data: [
          factories.platformUserEntity.build({
            id: 1,
            userId: userAccount.user.id,
            roles: [UserRole.Admin, UserRole.Member],
            platformId: platformOne.id,
          }),
          factories.platformUserEntity.build({
            id: 2,
            userId: userAccount.user.id,
            roles: [UserRole.Member],
            platformId: adminPlatform.id,
          }),
        ],
      });
    });

    afterAll(async () => {
      await prismaService.platformUser.deleteMany();
      await platformRepository.delete({});
    });

    it('fetches a full platform by id', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(2),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .get('/platforms/1/full')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: expect.any(Number),
            name: 'TEST_PLATFORM_1',
            name_handle: 'test_platform_1#1',
            is_verified: true,
            category: {
              id: 1,
              name: 'CATEGORY',
            },
            redirect_uris: ['https://www.example.com'],
            activity_webhook_uri: 'ACTIVITY_WEBHOOK_URI',
            client_secret: null,
            homepage_url: 'HOMEPAGE_URL',
          }),
        );
    });
  });

  describe('/platforms/:platformId (PATCH)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          userId: userAccount.user.id,
          platformId: platform.id,
        }),
      });
    });

    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('updates existing platform', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual({
            created_at: expect.any(String),
            updated_at: expect.any(String),
            id: 1,
            name: 'TEST_PLATFORM_2',
            name_handle: 'test_platform_2#1',
            is_verified: true,
            redirect_uris: ['https://www.example.com'],
            activity_webhook_uri: 'ACTIVITY_WEBHOOK_URI',
            client_secret: null,
            homepage_url: 'HOMEPAGE_URL',
          }),
        );
    });

    it('throws when insufficient permissions', async () => {
      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(HttpStatus.FORBIDDEN)
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
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          userId: userAccount.user.id,
          platformId: platform.id,
        }),
      });
    });

    it('deletes existing platform', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws insufficient permissions', async () => {
      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/generate-new-client-secret (PATCH)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.platformEntity.build({
          redirectUris: ['https://www.example.com'],
        }),
      );
      await prismaService.platformUser.create({
        data: factories.platformUserEntity.build({
          userId: userAccount.user.id,
          platformId: platform.id,
        }),
      });
    });

    it('generates new secret for platform', async () => {
      const params = new URLSearchParams({
        redirect_uri: 'https://www.example.com',
        state: 'TEST_STATE',
        code_challenge: codeChallenge,
        client_id: String(1),
      });
      const codeResp = await request(app.getHttpServer())
        .post(`/auth/code?${params.toString()}`)
        .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/authorization-code')
        .send({
          code: codeResp.body.code,
          redirect_uri: 'https://www.example.com',
          code_verifier: codeVerifier,
        });

      const res = await request(app.getHttpServer())
        .patch('/platforms/1/generate-new-client-secret')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(HttpStatus.OK)
        .expect((res) =>
          expect(res.body).toEqual(
            expect.objectContaining({
              client_secret: expect.any(String),
              id: 1,
            }),
          ),
        );

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toEqual(
        expect.objectContaining({
          client_secret: expect.any(String),
          id: 1,
        }),
      );
      const platform = await platformRepository.findOne(res.body.id);
      expect(platform.clientSecret).toEqual(res.body.client_secret);
    });

    it('throws insufficient permissions', async () => {
      await request(app.getHttpServer())
        .patch('/platforms/1/generate-new-client-secret')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });
});
