import { User } from '@prisma/client';

export type FollowActivityJobPayload = {
  type: 'FOLLOW';
  fromUser: User;
  toUser: User;
};

export type ActivityJobPayload = FollowActivityJobPayload;
