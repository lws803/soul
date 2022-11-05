import { Injectable } from '@nestjs/common';
import * as randomString from 'randomstring';
import { PlatformUser, Platform } from '@prisma/client';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/roles/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

import * as api from './serializers/api.dto';
import * as exceptions from './exceptions';
import { FindAllPlatformResponseEntity } from './serializers/api-responses.entity';

const NUM_ADMIN_ROLES_ALLOWED_PER_USER = 5;

@Injectable()
export class PlatformsService {
  constructor(
    private readonly usersService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async create(createPlatformDto: api.CreatePlatformDto, userId: number) {
    await this.isNewAdminPermittedOrThrow(userId);

    // TODO: Should wrap entire operation in transaction
    const savedPlatform = await this.prismaService.platform.create({
      data: {
        name: createPlatformDto.name,
        redirectUris: createPlatformDto.redirectUris,
        activityWebhookUri: createPlatformDto.activityWebhookUri,
        homepageUrl: createPlatformDto.homepageUrl,
        ...(createPlatformDto.category && {
          platformCategoryId: (
            await this.findOneCategoryOrThrow(createPlatformDto.category)
          ).id,
        }),
      },
    });

    const updatedPlatform = await this.prismaService.platform.update({
      where: { id: savedPlatform.id },
      data: {
        nameHandle: this.getPlatformHandle(
          createPlatformDto.name,
          savedPlatform.id,
        ),
      },
    });

    await this.prismaService.platformUser.create({
      data: {
        platformId: updatedPlatform.id,
        userId: userId,
        roles: [UserRole.Admin, UserRole.Member],
      },
    });
    return updatedPlatform;
  }

  async findAll(queryParams: api.FindAllPlatformsQueryParamDto) {
    const query = queryParams.q;
    const isVerified = queryParams.isVerified;
    const categoryNameFilter = queryParams.category;

    const where: Parameters<
      typeof this.prismaService.platform.findMany
    >[0]['where'] = {
      ...(query && { name: { startsWith: query } }),
      ...(isVerified !== undefined && { isVerified }),
      ...(categoryNameFilter && {
        platformCategoryId: (
          await this.findOneCategoryOrThrow(categoryNameFilter)
        ).id,
      }),
    };

    const platforms = await this.prismaService.platform.findMany({
      where,
      include: { category: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: queryParams.numItemsPerPage,
      skip: (queryParams.page - 1) * queryParams.numItemsPerPage,
    });

    const totalCount = await this.prismaService.platform.count({ where });

    return { platforms, totalCount };
  }

  async findMyPlatforms(
    queryParams: api.FindMyPlatformsQueryParamDto,
    userId: number,
  ): Promise<FindAllPlatformResponseEntity> {
    const role = queryParams.role;

    const platformUsers = await this.prismaService.platformUser.findMany({
      where: { userId, ...(role && { roles: { array_contains: role } }) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: queryParams.numItemsPerPage,
      skip: (queryParams.page - 1) * queryParams.numItemsPerPage,
      include: {
        platform: { include: { category: true } },
        user: true,
      },
    });

    const totalCount = await this.prismaService.platformUser.count({
      where: { userId, ...(role && { roles: { array_contains: role } }) },
    });

    return {
      platforms: platformUsers.map((platformUser) => platformUser.platform),
      totalCount,
    };
  }

  findOne(id: number) {
    return this.findPlatformOrThrow({ id });
  }

  async findOnePlatformUser(platformId: number, userId: number) {
    const platform = await this.findOne(platformId);
    const user = await this.usersService.findOne(userId);

    return this.findPlatformUserOrThrow({ platform, user });
  }

  async updateOnePlatformUser(
    { platformId, userId }: { platformId: number; userId: number },
    updatePlatformUserDto: api.UpdatePlatformUserBodyDto,
  ) {
    const platformUser = await this.findOnePlatformUser(platformId, userId);

    if (updatePlatformUserDto.roles) {
      const roles = updatePlatformUserDto.roles;
      if (
        (platformUser.roles as UserRole[]).includes(UserRole.Admin) &&
        !roles.includes(UserRole.Admin)
      ) {
        // Check if there are any remaining admins
        await this.findAnotherAdminOrThrow(platformId, userId);
      }

      if (roles.includes(UserRole.Admin))
        await this.isNewAdminPermittedOrThrow(userId);

      platformUser.roles = [...new Set(roles)];
      await this.revokePlatformUserRefreshToken(platformUser);
    }

    return await this.prismaService.platformUser.update({
      where: { id: platformUser.id },
      data: {
        roles: platformUser.roles,
        profileUrl:
          updatePlatformUserDto.profileUrl !== undefined
            ? updatePlatformUserDto.profileUrl
            : platformUser.profileUrl,
      },
      include: { user: true, platform: true },
    });
  }

  async update(id: number, updatePlatformDto: api.UpdatePlatformDto) {
    const platform = await this.findOne(id);
    const { category, name, redirectUris, activityWebhookUri, homepageUrl } =
      updatePlatformDto;

    return await this.prismaService.platform.update({
      where: { id: platform.id },
      data: {
        name,
        activityWebhookUri,
        homepageUrl,
        redirectUris,
        ...(name && { nameHandle: this.getPlatformHandle(name, platform.id) }),
        ...(category && {
          platformCategoryId: (await this.findOneCategoryOrThrow(category)).id,
        }),
      },
      include: { category: true },
    });
  }

  async remove(id: number) {
    const platform = await this.findOne(id);
    await this.prismaService.platform.delete({ where: { id: platform.id } });
  }

  async findAllPlatformUsers({
    platformId,
    params,
  }: {
    platformId?: number;
    params: api.ListAllPlatformUsersQueryParamDto;
  }) {
    const platformUsers = await this.prismaService.platformUser.findMany({
      where: {
        ...(platformId && { platformId }),
        ...(params.uid && { userId: { in: params.uid } }),
      },
      take: params.numItemsPerPage,
      skip: (params.page - 1) * params.numItemsPerPage,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        user: true,
        platform: { include: { category: true } },
      },
    });
    const totalCount = await this.prismaService.platformUser.count({
      where: {
        ...(platformId && { platformId }),
        ...(params.uid && { userId: { in: params.uid } }),
      },
    });

    return { platformUsers, totalCount };
  }

  async removeUser(platformId: number, userId: number) {
    const platformUser = await this.findOnePlatformUser(platformId, userId);
    // Check if there are any remaining admins
    await this.findAnotherAdminOrThrow(platformId, userId);
    await this.prismaService.platformUser.delete({
      where: { id: platformUser.id },
    });
  }

  async addUser(platformId: number, userId: number) {
    const user = await this.usersService.findOne(userId);

    await this.throwOnDuplicatePlatformUser(user.id, platformId);
    return await this.prismaService.platformUser.create({
      data: {
        platformId,
        userId: user.id,
        roles: [UserRole.Member],
      },
      include: { user: true, platform: { include: { category: true } } },
    });
  }

  async generateClientSecret(platformId: number): Promise<Platform> {
    const platform = await this.findOne(platformId);
    const savedPlatform = await this.prismaService.platform.update({
      where: { id: platform.id },
      data: { clientSecret: randomString.generate(32) },
    });

    return savedPlatform;
  }

  private async findPlatformOrThrow({ id }: { id: number }): Promise<Platform> {
    const platform = await this.prismaService.platform.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!platform) throw new exceptions.PlatformNotFoundException({ id });
    return platform;
  }

  private async findPlatformUserOrThrow({
    user,
    platform,
  }: {
    user: User;
    platform: Platform;
  }): Promise<PlatformUser> {
    const platformUser = await this.prismaService.platformUser.findFirst({
      where: { userId: user.id, platformId: platform.id },
      include: {
        user: true,
        platform: {
          include: { category: true },
        },
      },
    });

    if (!platformUser)
      throw new exceptions.PlatformUserNotFoundException({
        platformName: platform.nameHandle,
        username: user.userHandle,
      });

    return platformUser;
  }

  private async findAnotherAdminOrThrow(platformId: number, userId: number) {
    const adminPlatformUser = await this.prismaService.platformUser.findFirst({
      where: {
        roles: { array_contains: UserRole.Admin },
        platformId,
        userId: { not: userId },
      },
    });

    if (!adminPlatformUser) {
      throw new exceptions.NoAdminsRemainingException();
    }
  }

  private async isNewAdminPermittedOrThrow(userId: number) {
    const adminCount = await this.prismaService.platformUser.count({
      where: {
        roles: { array_contains: UserRole.Admin },
        userId,
      },
    });

    if (adminCount >= NUM_ADMIN_ROLES_ALLOWED_PER_USER)
      throw new exceptions.MaxAdminRolesPerUserException({
        max: NUM_ADMIN_ROLES_ALLOWED_PER_USER,
      });
  }

  private async revokePlatformUserRefreshToken(platformUser: PlatformUser) {
    await this.prismaService.refreshToken.updateMany({
      where: { platformUserId: platformUser.id },
      data: { isRevoked: true },
    });
  }

  private async findOneCategoryOrThrow(name: string) {
    const category = await this.prismaService.platformCategory.findFirst({
      where: { name },
    });
    if (!category)
      throw new exceptions.PlatformCategoryNotFoundException({ name });
    return category;
  }

  private getPlatformHandle(platformName: string, platformId: number) {
    return `${platformName.toLowerCase().replace(/\s+/g, '-')}#${platformId}`;
  }

  private async throwOnDuplicatePlatformUser(
    userId: number,
    platformId: number,
  ) {
    if (
      await this.prismaService.platformUser.findFirst({
        where: { userId, platformId },
      })
    )
      throw new exceptions.DuplicatePlatformUserException();
  }
}
