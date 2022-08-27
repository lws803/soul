import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';
import { UserRole } from 'src/roles/role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import {
  CreatePlatformDto,
  FindAllPlatformsQueryParamDto,
  FindMyPlatformsQueryParamDto,
  UpdatePlatformDto,
} from './dto/api.dto';
import { Platform } from './entities/platform.entity';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformCategory } from './entities/platform-category.entity';
import {
  PlatformNotFoundException,
  PlatformUserNotFoundException,
  NoAdminsRemainingException,
  DuplicatePlatformUserException,
  PlatformCategoryNotFoundException,
  MaxAdminRolesPerUserException,
} from './exceptions';
import { FindAllPlatformResponseDto } from './dto/api-responses.dto';

const NUM_ADMIN_ROLES_ALLOWED_PER_USER = 5;

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private platformRepository: Repository<Platform>,
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PlatformCategory)
    private readonly platformCategoryRepository: Repository<PlatformCategory>,
  ) {}

  async create(createPlatformDto: CreatePlatformDto, userId: number) {
    await this.isNewAdminPermittedOrThrow(userId);
    const platform = new Platform();
    platform.name = createPlatformDto.name;
    platform.redirectUris = createPlatformDto.redirectUris;
    platform.activityWebhookUri = createPlatformDto.activityWebhookUri;

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

    const newPlatformUser = new PlatformUser();
    newPlatformUser.platform = updatedPlatform;
    newPlatformUser.user = await this.usersService.findOne(userId);
    newPlatformUser.roles = [UserRole.Admin, UserRole.Member];

    await this.platformUserRepository.save(newPlatformUser);
    return updatedPlatform;
  }

  async findAll(queryParams: FindAllPlatformsQueryParamDto) {
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
    queryParams: FindMyPlatformsQueryParamDto,
    userId: number,
  ): Promise<FindAllPlatformResponseDto> {
    let baseQuery = this.platformUserRepository
      .createQueryBuilder('platformUser')
      .leftJoinAndSelect('platformUser.platform', 'platform')
      .leftJoinAndSelect('platform.category', 'category')
      .select();

    baseQuery = baseQuery.where('platformUser.user = :userId', {
      userId: userId,
    });

    const role = queryParams.role;
    if (role) {
      baseQuery = baseQuery.andWhere(`JSON_CONTAINS(roles, \'"${role}"\')`);
    }

    baseQuery = baseQuery
      .orderBy({ 'platformUser.createdAt': 'DESC', 'platformUser.id': 'DESC' })
      .take(queryParams.numItemsPerPage)
      .skip((queryParams.page - 1) * queryParams.numItemsPerPage);

    const [platformUsers, totalCount] = await baseQuery.getManyAndCount();

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

    return await this.findPlatformUserOrThrow({ platform, user });
  }

  async update(id: number, updatePlatformDto: UpdatePlatformDto) {
    const platform = await this.findOne(id);
    const updatedPlatform: Partial<Platform> = {};

    const {
      category,
      name: platformName,
      redirectUris,
      activityWebhookUri,
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

    await this.platformRepository.update({ id: platform.id }, updatedPlatform);
    return await this.platformRepository.findOne(id);
  }

  async remove(id: number) {
    const platform = await this.findOne(id);
    await this.platformRepository.delete({ id: platform.id });
  }

  async setUserRole(platformId: number, userId: number, roles: UserRole[]) {
    const platformUser = await this.findOnePlatformUser(platformId, userId);
    if (
      platformUser.roles.includes(UserRole.Admin) &&
      !roles.includes(UserRole.Admin)
    ) {
      // Check if there are any remaining admins
      await this.findAnotherAdminOrThrow(platformId, userId);
    }

    if (roles.includes(UserRole.Admin))
      await this.isNewAdminPermittedOrThrow(userId);

    platformUser.roles = [...new Set(roles)];

    await this.revokePlatformUserRefreshToken(platformUser);

    return await this.platformUserRepository.save(platformUser);
  }

  async findAllPlatformUsers({
    platformId,
    paginationParams,
  }: {
    platformId?: number;
    paginationParams: PaginationParamsDto;
  }) {
    let where: { platform?: Platform; user?: User } | undefined = undefined;
    if (platformId) {
      const platform = await this.findOne(platformId);
      where = { platform };
    }

    const [platformUsers, totalCount] =
      await this.platformUserRepository.findAndCount({
        order: { id: 'ASC' },
        take: paginationParams.numItemsPerPage,
        skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
        where,
        relations: ['user', 'platform'],
      });

    return { platformUsers, totalCount };
  }

  async removeUser(platformId: number, userId: number) {
    const platformUser = await this.findOnePlatformUser(platformId, userId);
    // Check if there are any remaining admins
    await this.findAnotherAdminOrThrow(platformId, userId);
    await this.platformUserRepository.delete({ id: platformUser.id });
  }

  async addUser(platformId: number, userId: number) {
    const newPlatformUser = new PlatformUser();
    newPlatformUser.platform = await this.findOne(platformId);
    newPlatformUser.user = await this.usersService.findOne(userId);
    newPlatformUser.roles = [UserRole.Member];

    try {
      return await this.platformUserRepository.save(newPlatformUser);
    } catch (exception) {
      if (
        exception instanceof QueryFailedError &&
        exception.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new DuplicatePlatformUserException();
      }
      throw exception;
    }
  }

  private async findPlatformOrThrow({ id }: { id: number }): Promise<Platform> {
    const platform = await this.platformRepository.findOne(id, {
      relations: ['userConnections', 'category'],
    });
    if (!platform) throw new PlatformNotFoundException({ id });
    return platform;
  }

  private async findPlatformUserOrThrow({
    user,
    platform,
  }: {
    user: User;
    platform: Platform;
  }): Promise<PlatformUser> {
    const platformUser = await this.platformUserRepository.findOne(
      {
        user,
        platform,
      },
      { relations: ['user', 'platform', 'platform.category'] },
    );
    if (!platformUser)
      throw new PlatformUserNotFoundException({
        platformName: platform.nameHandle,
        username: user.userHandle,
      });

    return platformUser;
  }

  private async findAnotherAdminOrThrow(platformId: number, userId: number) {
    const adminPlatformUser = await this.platformUserRepository
      .createQueryBuilder('platform_user')
      .where('JSON_CONTAINS(roles, \'"admin"\')', { platformId, userId })
      .andWhere('platform_id = :platformId', { platformId })
      .andWhere('user_id != :userId', { userId })
      .getOne();

    if (!adminPlatformUser) {
      throw new NoAdminsRemainingException();
    }
  }

  private async isNewAdminPermittedOrThrow(userId: number) {
    const adminCount = await this.platformUserRepository
      .createQueryBuilder('platform_user')
      .where('JSON_CONTAINS(roles, \'"admin"\')')
      .andWhere('user_id = :userId', { userId })
      .getCount();

    if (adminCount >= NUM_ADMIN_ROLES_ALLOWED_PER_USER)
      throw new MaxAdminRolesPerUserException({
        max: NUM_ADMIN_ROLES_ALLOWED_PER_USER,
      });
  }

  private async revokePlatformUserRefreshToken(platformUser: PlatformUser) {
    if (await this.refreshTokenRepository.findOne({ platformUser })) {
      await this.refreshTokenRepository.update(
        { platformUser },
        { isRevoked: true },
      );
    }
  }

  private async findOneCategoryOrThrow(name: string) {
    const category = await this.platformCategoryRepository.findOne({ name });
    if (!category) throw new PlatformCategoryNotFoundException({ name });
    return category;
  }

  private getPlatformHandle(platformName: string, platformId: number) {
    return `${platformName.toLowerCase().replace(/\s+/g, '-')}#${platformId}`;
  }
}
