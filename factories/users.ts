import { Factory } from 'fishery';

import { CreateUserDto, UpdateUserDto } from 'src/users/dto/api.dto';
import { User } from 'src/users/entities/user.entity';

export const oneUser = Factory.define<User>(() => ({
  id: 1,
  username: 'TEST_USER',
  userHandle: 'test_user#1',
  email: 'TEST_USER@EMAIL.COM',
  isActive: true,
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  hashedPassword: 'TEST_HASHED_PASSWORD',
}));

export const userArray = Factory.define<User[]>(() => [
  oneUser.build({
    id: 1,
    username: 'TEST_USER',
    userHandle: 'test_user#1',
    email: 'TEST_USER@EMAIL.COM',
  }),
  oneUser.build({
    id: 2,
    username: 'TEST_USER_2',
    userHandle: 'test_user_2#2',
    email: 'TEST_USER_2@EMAIL.COM',
  }),
]);

export const createUserDto = Factory.define<CreateUserDto>(() => ({
  email: 'TEST_USER@EMAIL.COM',
  username: 'TEST_USER',
  password: 'TEST_PASSWORD',
}));

export const updateUserDto = Factory.define<UpdateUserDto>(() => ({
  email: 'UPDATED_EMAIL@EMAIL.COM',
  username: 'UPDATED_USER',
}));
