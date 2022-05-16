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
} from './exceptions';

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
    const platform = new Platform();
    platform.name = createPlatformDto.name;
    platform.redirectUris = createPlatformDto.redirectUris;

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
        nameHandle: `${createPlatformDto.name}#${savedPlatform.id}`,
      },
    );
    const updatedPlatform = await this.platformRepository.findOne(
      savedPlatform.id,
    );

    const newPlatformUser = new PlatformUser();
    newPlatformUser.platform = updatedPlatform;
    newPlatformUser.user = await this.usersService.findOne(userId);
    newPlatformUser.roles = [UserRole.ADMIN, UserRole.MEMBER];

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
      baseQuery = baseQuery.where('platform.name like :query', {
        query: `${query}%`,
      });
    }
    const isVerified = queryParams.isVerified;
    if (isVerified) {
      baseQuery = baseQuery.where('platform.isVerified = :isVerified', {
        isVerified,
      });
    }
    baseQuery = baseQuery
      .orderBy('platform.id', 'ASC')
      .take(queryParams.numItemsPerPage)
      .skip((queryParams.page - 1) * queryParams.numItemsPerPage);

    const [platforms, totalCount] = await baseQuery.getManyAndCount();

    return { platforms, totalCount };
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
    const platform = await this.findPlatformOrThrow({ id });
    const updatedPlatform: Partial<Platform> = {};

    if (updatePlatformDto.name) {
      updatedPlatform.nameHandle = `${updatePlatformDto.name}#${platform.id}`;
      updatedPlatform.name = updatePlatformDto.name;
    }
    if (updatePlatformDto.category) {
      const categoryName = updatePlatformDto.category;
      updatedPlatform.category = await this.findOneCategoryOrThrow(
        categoryName,
      );
    }
    if (updatePlatformDto.redirectUris) {
      updatedPlatform.redirectUris = updatePlatformDto.redirectUris;
    }

    await this.platformRepository.update({ id: platform.id }, updatedPlatform);
    return await this.platformRepository.findOne(id);
  }

  async remove(id: number) {
    const platform = await this.findPlatformOrThrow({ id });
    await this.platformRepository.delete({ id: platform.id });
  }

  async setUserRole(platformId: number, userId: number, roles: UserRole[]) {
    const platform = await this.findPlatformOrThrow({ id: platformId });
    const user = await this.usersService.findOne(userId);
    const platformUser = await this.findPlatformUserOrThrow({ user, platform });
    if (
      platformUser.roles.includes(UserRole.ADMIN) &&
      !roles.includes(UserRole.ADMIN)
    ) {
      // Check if there are any remaining admins
      await this.findAnotherAdminOrThrow(platformId, userId);
    }

    platformUser.user = user;
    platformUser.platform = platform;
    platformUser.roles = [...new Set(roles)];

    await this.revokePlatformUserRefreshToken(platformUser);

    return await this.platformUserRepository.save(platformUser);
  }

  async findAllPlatformUsers(
    platformId: number,
    paginationParams: PaginationParamsDto,
  ) {
    const platform = await this.findPlatformOrThrow({ id: platformId });
    const [platformUsers, totalCount] =
      await this.platformUserRepository.findAndCount({
        order: { id: 'ASC' },
        take: paginationParams.numItemsPerPage,
        skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
        where: { platform },
        relations: ['user'],
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
    newPlatformUser.roles = [UserRole.MEMBER];

    try {
      return await this.platformUserRepository.save(newPlatformUser);
    } catch (exception) {
      if (exception instanceof QueryFailedError) {
        if (exception.driverError.code === 'ER_DUP_ENTRY') {
          throw new DuplicatePlatformUserException();
        }
        throw exception;
      }
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
    const platformUser = await this.platformUserRepository.findOne({
      user,
      platform,
    });
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
      .where(
        'JSON_CONTAINS(roles, \'"admin"\') AND platform_id = :platformId ' +
          'AND user_id != :userId',
        { platformId, userId },
      )
      .getOne();

    if (!adminPlatformUser) {
      throw new NoAdminsRemainingException();
    }
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
}
