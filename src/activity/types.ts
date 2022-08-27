import { User } from 'src/users/entities/user.entity';

export type FollowActivityJobPayload = {
  type: 'FOLLOW';
  fromUser: User;
  toUser: User;
};

export type ActivityJobPayload = FollowActivityJobPayload;

type SanitizedUser = {
  userHandle: User['userHandle'];
  username: User['username'];
  id: User['id'];
};

export type FollowActivityWebhookPayload = {
  type: 'FOLLOW';
  sender: SanitizedUser;
  recipient: SanitizedUser;
};
