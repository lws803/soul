import { Factory } from 'fishery';

import { User } from 'src/users/entities/user.entity';

export const userEntity = Factory.define<User>(({ sequence }) => {
  // Rewinds the sequence as we do not want to have "sequences" bleed into subsequent builds
  userEntity.rewindSequence();
  return {
    id: sequence,
    username: `test-user-${sequence}`,
    userHandle: `test-user-${sequence}#${sequence}`,
    email: `TEST_USER_${sequence}@EMAIL.COM`,
    isActive: true,
    createdAt: new Date('1995-12-17T03:24:00'),
    updatedAt: new Date('1995-12-18T03:24:00'),
    hashedPassword: 'TEST_HASHED_PASSWORD',
    displayName: 'DISPLAY_NAME',
    bio: 'BIO',
  };
});

type UpdateUserRequest = {
  email: string;
  username: string;
  display_name: string;
  bio: string;
};

export const updateUserRequest = Factory.define<UpdateUserRequest>(() => ({
  email: 'UPDATED_EMAIL@EMAIL.COM',
  username: 'updated-user',
  display_name: 'UPDATED_DISPLAY_NAME',
  bio: 'UPDATED_BIO',
}));

type CreateUserRequest = {
  email: string;
  username: string;
  password: string;
  bio: string;
  display_name: string;
};

export const createUserRequest = Factory.define<CreateUserRequest>(() => ({
  email: 'TEST_USER@EMAIL.COM',
  username: 'test-user',
  password: 'TEST_PASSWORD',
  bio: null,
  display_name: null,
}));
