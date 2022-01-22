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
    .send(factories.createUserDto.build({ password: '1oNc0iY3oml5d&%9' }))
    .expect(201);

  await request(app.getHttpServer())
    .post('/users')
    .send(
      factories.createUserDto.build({
        email: 'TEST_USER_2@EMAIL.COM',
        username: 'TEST_USER_2',
        password: '1oNc0iY3oml5d&%9',
      }),
    )
    .expect(201);

  await request(app.getHttpServer())
    .post('/users')
    .send(
      factories.createUserDto.build({
        email: 'TEST_USER_3@EMAIL.COM',
        username: 'TEST_USER_3',
        password: '1oNc0iY3oml5d&%9',
      }),
    )
    .expect(201);

  // Sets all users to active
  await userRepository
    .createQueryBuilder('user')
    .update(User)
    .set({ isActive: true })
    .execute();

  const firstUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

  const secondUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER_2@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

  const thirdUserLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'TEST_USER_3@EMAIL.COM', password: '1oNc0iY3oml5d&%9' });

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
    thirdUser: {
      accessToken: thirdUserLoginResponse.body.accessToken,
      refreshToken: thirdUserLoginResponse.body.refreshToken,
      user: await userRepository.findOne({ email: 'TEST_USER_3@EMAIL.COM' }),
    },
  };
}

export type UserAccount = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
