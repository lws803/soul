import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as randomString from 'randomstring';
import { PlatformUser } from '@prisma/client';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/roles/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

import * as api from './serializers/api.dto';
import * as exceptions from './exceptions';
import { Platform } from './entities/platform.entity';
import { FindAllPlatformResponseEntity } from './serializers/api-responses.entity';

const NUM_ADMIN_ROLES_ALLOWED_PER_USER = 5;

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private platformRepository: Repository<Platform>,
    private readonly usersService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async create(createPlatformDto: api.CreatePlatformDto, userId: number) {
    await this.isNewAdminPermittedOrThrow(userId);
    const platform = new Platform();
    platform.name = createPlatformDto.name;
    platform.redirectUris = createPlatformDto.redirectUris;
    platform.activityWebhookUri = createPlatformDto.activityWebhookUri;
    platform.homepageUrl = createPlatformDto.homepageUrl;

    if (createPlatformDto.category) {
      const category = await this.findOneCategoryOrThrow(
        createPlatformDto.category,
      );
      platform.category = category;
    }

    const savedPlatform = await this.platformRepository.save(platform);
    await this.platformRepository.update(
      { id: savedPlatform.id },
      {
        nameHandle: this.getPlatformHandle(
          createPlatformDto.name,
          savedPlatform.id,
        ),
      },
    );
    const updatedPlatform = await this.platformRepository.findOne(
      savedPlatform.id,
    );

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
    let baseQuery = this.platformRepository
      .createQueryBuilder('platform')
      .leftJoinAndSelect('platform.category', 'category')
      .select();

    const query = queryParams.q;
    if (query) {
      baseQuery = baseQuery.andWhere('platform.name like :query', {
        query: `${query}%`,
      });
    }
    const isVerified = queryParams.isVerified;
    if (isVerified) {
      baseQuery = baseQuery.andWhere('platform.isVerified = :isVerified', {
        isVerified,
      });
    }
    const categoryNameFilter = queryParams.category;
    if (categoryNameFilter) {
      const category = await this.findOneCategoryOrThrow(categoryNameFilter);
      baseQuery = baseQuery.andWhere('platform.category = :categoryId', {
        categoryId: category.id,
      });
    }

    baseQuery = baseQuery
      .orderBy({ 'platform.createdAt': 'DESC', 'platform.id': 'DESC' })
      .take(queryParams.numItemsPerPage)
      .skip((queryParams.page - 1) * queryParams.numItemsPerPage);

    const [platforms, totalCount] = await baseQuery.getManyAndCount();

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
    const updatedPlatform: Partial<Platform> = {};

    const {
      category,
      name: platformName,
      redirectUris,
      activityWebhookUri,
      homepageUrl,
    } = updatePlatformDto;

    if (platformName) {
      updatedPlatform.nameHandle = this.getPlatformHandle(
        platformName,
        platform.id,
      );
    }
    if (category) {
      updatedPlatform.category = await this.findOneCategoryOrThrow(category);
    }

    updatedPlatform.redirectUris = redirectUris ?? platform.redirectUris;
    updatedPlatform.name = platformName ?? platform.name;
    updatedPlatform.activityWebhookUri =
      activityWebhookUri ?? platform.activityWebhookUri;
    updatedPlatform.homepageUrl =
      homepageUrl !== undefined ? homepageUrl : platform.homepageUrl;

    await this.platformRepository.update({ id: platform.id }, updatedPlatform);
    return this.platformRepository.findOne(id);
  }

  async remove(id: number) {
    const platform = await this.findOne(id);
    await this.platformRepository.delete({ id: platform.id });
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
    platform.clientSecret = randomString.generate(32);

    return this.platformRepository.save(platform);
  }

  private async findPlatformOrThrow({ id }: { id: number }): Promise<Platform> {
    const platform = await this.platformRepository.findOne(id, {
      relations: ['userConnections', 'category'],
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
