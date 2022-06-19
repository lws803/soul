import { Factory } from 'fishery';

import {
  CreateUserConnectionDto,
  PostPlatformDto,
} from 'src/user-connections/dto/api.dto';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';

import { onePlatform } from './platform';
import { oneUser } from './users';

export const oneUserConnection = Factory.define<UserConnection>(() => ({
  id: 1,
  fromUser: oneUser.build(),
  toUser: oneUser.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
  platforms: [],
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  mutualConnection: null,
}));

export const userConnectionArray = Factory.define<UserConnection[]>(() => [
  oneUserConnection.build({ id: 1 }),
  oneUserConnection.build({
    id: 2,
    fromUser: oneUser.build({ id: 3 }),
    toUser: oneUser.build({ id: 4 }),
  }),
]);

export const createUserConnectionDto = Factory.define<CreateUserConnectionDto>(
  () => ({
    fromUserId: oneUser.build().id,
    toUserId: oneUser.build({ id: 2 }).id,
  }),
);

export const postPlatformToUserConnectionDto = Factory.define<PostPlatformDto>(
  () => ({
    platformId: onePlatform.build().id,
  }),
);

type CreateUserConnectionRequestDto = {
  from_user_id: number;
  to_user_id: number;
  platform_id?: number;
};

export const createUserConnectionRequestDto =
  Factory.define<CreateUserConnectionRequestDto>(() => ({
    from_user_id: oneUser.build().id,
    to_user_id: oneUser.build({ id: 2 }).id,
  }));

type PostPlatformToUserConnectionRequestDto = {
  platform_id: number;
};

export const postPlatformToUserConnectionRequestDto =
  Factory.define<PostPlatformToUserConnectionRequestDto>(() => ({
    platform_id: onePlatform.build().id,
  }));
