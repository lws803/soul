import { Factory } from 'fishery';

import * as factories from 'factories';
import { Platform } from 'src/platforms/entities/platform.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import {
  UpdatePlatformDto,
  CreatePlatformDto,
} from 'src/platforms/serializers/api.dto';
import { UserRole } from 'src/roles/role.enum';
import { PlatformCategory } from 'src/platforms/entities/platform-category.entity';

export const onePlatformCategory = Factory.define<PlatformCategory>(() => ({
  id: 1,
  name: 'CATEGORY',
}));

export const platformEntity = Factory.define<Platform>(({ sequence }) => {
  platformEntity.rewindSequence();
  return {
    id: sequence,
    name: `TEST_PLATFORM_${sequence}`,
    nameHandle: `test_platform_${sequence}#${sequence}`,
    createdAt: new Date('1995-12-17T03:24:00'),
    updatedAt: new Date('1995-12-18T03:24:00'),
    userConnections: [],
    isVerified: true,
    redirectUris: ['TEST_REDIRECT_URI'],
    category: onePlatformCategory.build(),
    activityWebhookUri: 'ACTIVITY_WEBHOOK_URI',
  };
});

export const platformUser = Factory.define<PlatformUser>(({ sequence }) => {
  platformUser.rewindSequence();

  return {
    id: sequence,
    user: factories.userEntity.build(),
    platform: factories.platformEntity.build(),
    roles: [UserRole.Admin, UserRole.Member],
    createdAt: new Date('1995-12-17T03:24:00'),
    updatedAt: new Date('1995-12-18T03:24:00'),
  };
});

export const updatePlatformDto = Factory.define<UpdatePlatformDto>(() => ({
  name: 'TEST_PLATFORM_UPDATE',
  category: 'CATEGORY_UPDATE',
}));

export const createPlatformDto = Factory.define<CreatePlatformDto>(() => ({
  name: 'TEST_PLATFORM',
  redirectUris: ['TEST_REDIRECT_URI'],
  category: onePlatformCategory.build().name,
}));

type CreatePlatformRequest = {
  name: string;
  redirect_uris: string[];
  category: string;
  activity_webhook_uri?: string;
};

export const createPlatformRequest = Factory.define<CreatePlatformRequest>(
  () => ({
    name: 'TEST_PLATFORM',
    redirect_uris: ['TEST_REDIRECT_URI'],
    category: onePlatformCategory.build().name,
    activity_webhook_uri: 'ACTIVITY_WEBHOOK_URI',
  }),
);
