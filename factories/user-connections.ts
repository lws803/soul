import { Factory } from 'fishery';

import { FindOneUserConnectionResponseEntity } from 'src/user-connections/serializers/api-responses.entity';

import { UserConnection } from 'src/user-connections/entities/user-connection.entity';

import { platformEntity } from './platform';
import { userEntity } from './users';

export const userConnectionEntity = Factory.define<UserConnection>(() => ({
  id: 1,
  fromUser: userEntity.build(),
  toUser: userEntity.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
  platforms: [],
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  mutualConnection: null,
}));

export const oneUserConnectionResponseEntity =
  Factory.define<FindOneUserConnectionResponseEntity>(() => ({
    id: 1,
    fromUser: userEntity.build(),
    toUser: userEntity.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
    platforms: [],
    createdAt: new Date('1995-12-17T03:24:00'),
    updatedAt: new Date('1995-12-18T03:24:00'),
    mutualConnection: null,
    isMutual: false,
  }));

export const userConnectionEntityArray = Factory.define<UserConnection[]>(
  () => [
    userConnectionEntity.build({ id: 1 }),
    userConnectionEntity.build({
      id: 2,
      fromUser: userEntity.build({ id: 3 }),
      toUser: userEntity.build({ id: 4 }),
    }),
  ],
);

type CreateUserConnectionRequest = {
  to_user_id: number;
  platform_id?: number;
};

export const createUserConnectionRequest =
  Factory.define<CreateUserConnectionRequest>(() => ({
    to_user_id: userEntity.build({ id: 2 }).id,
  }));

type PostPlatformToUserConnectionRequest = {
  platform_id: number;
};

export const postPlatformToUserConnectionRequest =
  Factory.define<PostPlatformToUserConnectionRequest>(() => ({
    platform_id: platformEntity.build().id,
  }));
