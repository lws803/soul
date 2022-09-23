import { Factory } from 'fishery';

import { CreateUserDto, UpdateUserDto } from 'src/users/serializers/api.dto';
import { User } from 'src/users/entities/user.entity';

export const user = Factory.define<User>(({ sequence }) => {
  // Rewinds the sequence as we do not want to have "sequences" bleed into subsequent builds
  user.rewindSequence();
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

export const createUserDto = Factory.define<CreateUserDto>(() => ({
  email: 'TEST_USER@EMAIL.COM',
  username: 'test-user',
  password: 'TEST_PASSWORD',
  bio: null,
  displayName: null,
}));

export const updateUserDto = Factory.define<UpdateUserDto>(() => ({
  email: 'UPDATED_EMAIL@EMAIL.COM',
  username: 'updated-user',
  displayName: 'UPDATED_DISPLAY_NAME',
  bio: 'UPDATED_BIO',
}));
