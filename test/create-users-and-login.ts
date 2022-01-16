import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';

import { User } from 'src/users/entities/user.entity';

import * as factories from '../factories';

export async function createUsersAndLogin(app: INestApplication) {
  const connection = app.get(Connection);
  const userRepository = connection.getRepository(User);

  await request(app.getHttpServer())
    .post('/users')
    .send(factories.createUserDto.build())
    .expect(201);

  await request(app.getHttpServer())
    .post('/users')
    .send(
      factories.createUserDto.build({
        email: 'TEST_USER_2@EMAIL.COM',
        username: 'TEST_USER_2',
      }),
    )
    .expect(201);

  const firstUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

  const secondUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER_2@EMAIL.COM', password: 'TEST_PASSWORD' });

  return {
    firstUser: {
      accessToken: firstUserLoginResponse.body.accessToken,
      refreshToken: firstUserLoginResponse.body.refreshToken,
      user: await userRepository.findOne({ email: 'TEST_USER@EMAIL.COM' }),
    },
    secondUser: {
      accessToken: secondUserLoginResponse.body.accessToken,
      refreshToken: secondUserLoginResponse.body.refreshToken,
      user: await userRepository.findOne({ email: 'TEST_USER_2@EMAIL.COM' }),
    },
  };
}
