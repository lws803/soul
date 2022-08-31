import { Factory } from 'fishery';

import { FindOneUserConnectionResponseDto } from 'src/user-connections/dto/api-responses.dto';

import {
  CreateUserConnectionDto,
  PostPlatformDto,
} from 'src/user-connections/dto/api.dto';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';

import { platform } from './platform';
import { user } from './users';

export const oneUserConnection = Factory.define<UserConnection>(() => ({
  id: 1,
  fromUser: user.build(),
  toUser: user.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
  platforms: [],
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  mutualConnection: null,
}));

export const oneUserConnectionResponse =
  Factory.define<FindOneUserConnectionResponseDto>(() => ({
    id: 1,
    fromUser: user.build(),
    toUser: user.build({ id: 2, email: 'TEST_USER_2@EMAIL.COM' }),
    platforms: [],
    createdAt: new Date('1995-12-17T03:24:00'),
    updatedAt: new Date('1995-12-18T03:24:00'),
    mutualConnection: null,
    isMutual: false,
  }));

export const userConnectionArray = Factory.define<UserConnection[]>(() => [
  oneUserConnection.build({ id: 1 }),
  oneUserConnection.build({
    id: 2,
    fromUser: user.build({ id: 3 }),
    toUser: user.build({ id: 4 }),
  }),
]);

export const createUserConnectionDto = Factory.define<CreateUserConnectionDto>(
  () => ({
    fromUserId: user.build().id,
    toUserId: user.build({ id: 2 }).id,
  }),
);

export const postPlatformToUserConnectionDto = Factory.define<PostPlatformDto>(
  () => ({
    platformId: platform.build().id,
  }),
);

type CreateUserConnectionRequestDto = {
  from_user_id: number;
  to_user_id: number;
  platform_id?: number;
};

export const createUserConnectionRequestDto =
  Factory.define<CreateUserConnectionRequestDto>(() => ({
    from_user_id: user.build().id,
    to_user_id: user.build({ id: 2 }).id,
  }));

type PostPlatformToUserConnectionRequestDto = {
  platform_id: number;
};

export const postPlatformToUserConnectionRequestDto =
  Factory.define<PostPlatformToUserConnectionRequestDto>(() => ({
    platform_id: platform.build().id,
  }));
