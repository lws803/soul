import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { User } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import * as factories from '../../factories';

export async function createUsersAndLoginFixture(app: INestApplication) {
  const prismaService = app.get<PrismaService>(PrismaService);

  await request(app.getHttpServer())
    .post('/users')
    .send(factories.createUserRequest.build({ password: '1oNc0iY3oml5d&%9' }))
    .expect(201);

  await request(app.getHttpServer())
    .post('/users')
    .send(
      factories.createUserRequest.build({
        email: 'TEST_USER_2@EMAIL.COM',
        username: 'test-user-2',
        password: '1oNc0iY3oml5d&%9',
      }),
    )
    .expect(201);

  await request(app.getHttpServer())
    .post('/users')
    .send(
      factories.createUserRequest.build({
        email: 'TEST_USER_3@EMAIL.COM',
        username: 'test-user-3',
        password: '1oNc0iY3oml5d&%9',
      }),
    )
    .expect(201);

  // Sets all users to active
  await prismaService.user.updateMany({
    data: { isActive: true },
  });

  const firstUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

  const secondUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

  const thirdUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER_3@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

  return [
    {
      accessToken: firstUserLoginResponse.body.access_token,
      refreshToken: firstUserLoginResponse.body.refresh_token,
      user: await prismaService.user.findUnique({
        where: { email: 'TEST_USER@EMAIL.COM' },
      }),
    },
    {
      accessToken: secondUserLoginResponse.body.access_token,
      refreshToken: secondUserLoginResponse.body.refresh_token,
      user: await prismaService.user.findUnique({
        where: { email: 'TEST_USER_2@EMAIL.COM' },
      }),
    },
    {
      accessToken: thirdUserLoginResponse.body.access_token,
      refreshToken: thirdUserLoginResponse.body.refresh_token,
      user: await prismaService.user.findUnique({
        where: { email: 'TEST_USER_3@EMAIL.COM' },
      }),
    },
  ];
}

export type UserAccount = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
