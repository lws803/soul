import { User } from 'src/users/entities/user.entity';

export type FollowActivityPayload = {
  type: 'FOLLOW';
  fromUser: User;
  toUser: User;
};

export type ActivityPayload = FollowActivityPayload;
