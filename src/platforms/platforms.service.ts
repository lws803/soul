import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';
import { UserRole } from 'src/roles/role.enum';

import { CreatePlatformDto, UpdatePlatformDto } from './dto/api.dto';
import { Platform } from './entities/platform.entity';
import { PlatformUser } from './entities/platform-user.entity';
import {
  PlatformNotFoundException,
  PlatformUserNotFoundException,
  NoAdminsRemainingException,
} from './exceptions';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private platformRepository: Repository<Platform>,
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
    private readonly usersService: UsersService,
  ) {}

  async create(createPlatformDto: CreatePlatformDto, userId: number) {
    const platform = new Platform();
    platform.name = createPlatformDto.name;
    platform.hostUrl = createPlatformDto.hostUrl;

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

  async findAll(paginationParams: PaginationParamsDto) {
    const [platforms, totalCount] = await this.platformRepository.findAndCount({
      order: { id: 'ASC' },
      take: paginationParams.numItemsPerPage,
      skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
    });
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
    }
    await this.platformRepository.update(
      { id: platform.id },
      { ...updatedPlatform, ...updatePlatformDto },
    );
    return await this.platformRepository.findOne(id);
  }

  async remove(id: number) {
    const platform = await this.findPlatformOrThrow({ id });
    await this.platformRepository.delete({ id: platform.id });
  }

  async setUserRole(platformId: number, userId: number, roles: UserRole[]) {
    const platform = await this.findPlatformOrThrow({ id: platformId });
    const user = await this.usersService.findOne(userId);
    let platformUser = await this.platformUserRepository.findOne({
      user,
      platform,
    });
    if (!platformUser) {
      platformUser = new PlatformUser();
    }
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
    return await this.platformUserRepository.delete({ id: platformUser.id });
  }

  private async findPlatformOrThrow({ id }: { id: number }): Promise<Platform> {
    const platform = await this.platformRepository.findOne(id, {
      relations: ['userConnections'],
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
}
