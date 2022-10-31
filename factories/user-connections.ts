import { Factory } from 'fishery';
import { UserConnection } from '@prisma/client';

import { userEntity } from './users';

export const userConnectionEntity = Factory.define<UserConnection>(() => ({
  id: 1,
  oppositeUserConnectionId: null,
  fromUserId: 1,
  toUserId: 2,
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
}));

export const userConnectionEntityArray = Factory.define<UserConnection[]>(
  () => [
    userConnectionEntity.build({ id: 1 }),
    userConnectionEntity.build({
      id: 2,
      fromUserId: 3,
      toUserId: 4,
    }),
  ],
);

type CreateUserConnectionRequest = {
  to_user_id: number;
};

export const createUserConnectionRequest =
  Factory.define<CreateUserConnectionRequest>(() => ({
    to_user_id: userEntity.build({ id: 2 }).id,
  }));
