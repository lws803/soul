import { Factory } from 'fishery';
import { PlatformUser, PlatformCategory } from '@prisma/client';

import * as factories from 'factories';
import { Platform } from 'src/platforms/entities/platform.entity';
import { UserRole } from 'src/roles/role.enum';

export const platformCategoryEntity = Factory.define<PlatformCategory>(() => ({
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
    category: platformCategoryEntity.build(),
    activityWebhookUri: 'ACTIVITY_WEBHOOK_URI',
    clientSecret: null,
    homepageUrl: 'HOMEPAGE_URL',
  };
});

export const platformUserEntity = Factory.define<PlatformUser>(
  ({ sequence }) => {
    platformUserEntity.rewindSequence();
    const user = factories.userEntity.build();
    const platform = factories.platformEntity.build();

    return {
      id: sequence,
      platformId: user.id,
      userId: platform.id,
      roles: [UserRole.Admin, UserRole.Member],
      createdAt: new Date('1995-12-17T03:24:00'),
      updatedAt: new Date('1995-12-18T03:24:00'),
      profileUrl: 'PROFILE_URL',
    };
  },
);

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
    category: platformCategoryEntity.build().name,
    activity_webhook_uri: 'ACTIVITY_WEBHOOK_URI',
    homepage_url: 'HOMEPAGE_URL',
  }),
);

type UpdatePlatformRequest = {
  name: string;
  category: string;
  activity_webhook_uri?: string;
  homepage_url?: string;
};

export const updatePlatformRequest = Factory.define<UpdatePlatformRequest>(
  () => ({
    name: 'TEST_PLATFORM_UPDATE',
    category: 'CATEGORY_UPDATE',
    homepageUrl: 'HOMEPAGE_URL_UPDATE',
  }),
);

type UpdatePlatformUserRequest = {
  profile_url?: string | null;
  roles?: string[];
};

export const updatePlatformUserRequest =
  Factory.define<UpdatePlatformUserRequest>(() => ({
    profile_url: 'PROFILE_URL_UPDATE',
    roles: ['admin', 'member'],
  }));
