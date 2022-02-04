import { Factory } from 'fishery';

import * as factories from 'factories';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import {
  UpdatePlatformDto,
  CreatePlatformDto,
} from 'src/platforms/dto/api.dto';
import { UserRole } from 'src/roles/role.enum';

export const onePlatform = Factory.define<Platform>(() => ({
  id: 1,
  name: 'TEST_PLATFORM',
  nameHandle: 'TEST_PLATFORM#1',
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
  userConnections: [],
  isVerified: true,
  redirectUris: ['TEST_REDIRECT_URI'],
}));

export const platformArray = Factory.define<Platform[]>(() => [
  onePlatform.build(),
  onePlatform.build({ id: 2, name: 'TEST_PLATFORM_2' }),
]);

export const onePlatformUser = Factory.define<PlatformUser>(() => ({
  id: 1,
  user: factories.oneUser.build(),
  platform: factories.onePlatform.build(),
  roles: [UserRole.ADMIN, UserRole.MEMBER],
  createdAt: new Date('1995-12-17T03:24:00'),
  updatedAt: new Date('1995-12-18T03:24:00'),
}));

export const platformUserArray = Factory.define<PlatformUser[]>(() => [
  onePlatformUser.build(),
  onePlatformUser.build({ id: 2 }),
]);

export const updatePlatformDto = Factory.define<UpdatePlatformDto>(() => ({
  name: 'TEST_PLATFORM_UPDATE',
}));

export const createPlatformDto = Factory.define<CreatePlatformDto>(() => ({
  name: 'TEST_PLATFORM',
  redirectUris: ['TEST_REDIRECT_URI'],
}));
