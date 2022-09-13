import { User } from 'src/users/entities/user.entity';

export type FollowActivityJobPayload = {
  type: 'FOLLOW';
  fromUser: User;
  toUser: User;
};

export type ActivityJobPayload = FollowActivityJobPayload;
