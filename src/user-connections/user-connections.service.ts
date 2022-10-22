import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { PaginationParamsDto } from 'src/common/serializers/pagination-params.dto';
import { ActivityService } from 'src/activity/activity.service';

import { CreateUserConnectionDto } from './serializers/api.dto';
import { UserConnection } from './entities/user-connection.entity';
import {
  UserConnectionNotFoundException,
  UserConnectionToSelfException,
  UserNotInvolvedInConnectionException,
  DuplicateUserConnectionException,
} from './exceptions';
import {
  AddNewPlatformToUserConnectionResponseEntity,
  CreateUserConnectionResponseEntity,
  FindAllUserConnectionResponseEntity,
  FindOneUserConnectionResponseEntity,
} from './serializers/api-responses.entity';
import { ConnectionType } from './enums/connection-type.enum';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';

@Injectable()
export class UserConnectionsService {
  constructor(
    @InjectRepository(UserConnection)
    private userConnectionRepository: Repository<UserConnection>,
    private usersService: UsersService,
    private platformService: PlatformsService,
    private activityService: ActivityService,
  ) {}

  async create(
    currentUserId: number,
    createUserConnectionDto: CreateUserConnectionDto,
  ): Promise<CreateUserConnectionResponseEntity> {
    if (currentUserId === createUserConnectionDto.toUserId) {
      throw new UserConnectionToSelfException();
    }

    const fromUser = await this.usersService.findOne(currentUserId);
    const toUser = await this.usersService.findOne(
      createUserConnectionDto.toUserId,
    );
    const newUserConnection = new UserConnection();
    newUserConnection.fromUser = fromUser;
    newUserConnection.toUser = toUser;

    if (createUserConnectionDto.platformId) {
      newUserConnection.platforms = [
        await this.platformService.findOne(createUserConnectionDto.platformId),
      ];
    }

    try {
      const currentConnection = await this.userConnectionRepository.save(
        newUserConnection,
      );
      const oppositeConnection = await this.userConnectionRepository.findOne({
        fromUser: toUser,
        toUser: fromUser,
      });
      if (oppositeConnection) {
        await this.userConnectionRepository.update(
          { id: currentConnection.id },
          { mutualConnection: oppositeConnection },
        );
        await this.userConnectionRepository.update(
          { id: oppositeConnection.id },
          { mutualConnection: currentConnection },
        );
      }
      await this.activityService.sendFollowActivity({ fromUser, toUser });
      return { ...currentConnection, isMutual: !!oppositeConnection };
    } catch (exception) {
      if (
        exception instanceof QueryFailedError &&
        exception.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new DuplicateUserConnectionException(
          currentUserId,
          createUserConnectionDto.toUserId,
        );
      }
    }
  }

  async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<FindAllUserConnectionResponseEntity> {
    const [userConnections, totalCount] =
      await this.userConnectionRepository.findAndCount({
        order: { createdAt: 'DESC', id: 'DESC' },
        take: paginationParams.numItemsPerPage,
        skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
        relations: ['platforms', 'fromUser', 'toUser'],
      });
    return { userConnections, totalCount };
  }

  async findOne(id: number): Promise<FindOneUserConnectionResponseEntity> {
    const userConnection = await this.findUserConnectionOrThrow({ id });
    const oppositeConnection = await this.userConnectionRepository.findOne({
      fromUser: userConnection.toUser,
      toUser: userConnection.fromUser,
    });

    return { ...userConnection, isMutual: !!oppositeConnection };
  }

  async findOneByUserIds(
    fromUserId: number,
    toUserId: number,
  ): Promise<FindOneUserConnectionResponseEntity> {
    const userConnection = await this.findUserConnectionOrThrow({
      fromUserId,
      toUserId,
    });
    const oppositeConnection = await this.userConnectionRepository.findOne({
      fromUser: userConnection.toUser,
      toUser: userConnection.fromUser,
    });

    return { ...userConnection, isMutual: !!oppositeConnection };
  }

  async remove(id: number, currentUserId: number) {
    const userConnection = await this.findOne(id);
    if (userConnection.fromUser.id !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }
    await this.userConnectionRepository.delete({ id });
  }

  async addNewPlatformToUserConnection(
    id: number,
    platformId: number,
    currentUserId: number,
  ): Promise<AddNewPlatformToUserConnectionResponseEntity> {
    const { isMutual: _isMutual, ...userConnection } = await this.findOne(id);
    if (userConnection.fromUser.id !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }
    const platform = await this.platformService.findOne(platformId);
    userConnection.platforms = Array.from(
      new Set([...userConnection.platforms, platform]),
    );
    return this.userConnectionRepository.save(userConnection);
  }

  async removePlatformFromUserConnection(
    id: number,
    platformId: number,
    currentUserId: number,
  ) {
    const { isMutual: _isMutual, ...userConnection } = await this.findOne(id);
    const platform = await this.platformService.findOne(platformId);
    if (userConnection.fromUser.id !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }
    userConnection.platforms.splice(
      userConnection.platforms.indexOf(platform),
      1,
    );
    await this.userConnectionRepository.save(userConnection);
  }

  async findMyUserConnections({
    userId,
    connectionType,
    paginationParams,
    platformId,
  }: {
    userId: number;
    connectionType: ConnectionType;
    paginationParams: PaginationParamsDto;
    platformId?: number;
  }) {
    const fromUser = await this.usersService.findOne(userId);
    let baseQuery = this.userConnectionRepository
      .createQueryBuilder('userConnection')
      .leftJoinAndSelect('userConnection.fromUser', 'fromUser')
      .leftJoinAndSelect('userConnection.toUser', 'toUser')
      .leftJoinAndSelect('userConnection.mutualConnection', 'mutualConnection');

    if (platformId) {
      const platform = await this.platformService.findOne(platformId);
      baseQuery = baseQuery
        .leftJoinAndMapOne(
          'userConnection.toPlatformUser',
          PlatformUser,
          'toPlatformUser',
          'toPlatformUser.platform = :platformId AND userConnection.toUser = toPlatformUser.user',
          { platformId: platform.id },
        )
        .leftJoinAndMapOne(
          'userConnection.fromPlatformUser',
          PlatformUser,
          'fromPlatformUser',
          'fromPlatformUser.platform = :platformId AND userConnection.fromUser = fromPlatformUser.user',
          { platformId: platform.id },
        );
    }

    baseQuery = baseQuery.select();

    if (connectionType === ConnectionType.Mutual) {
      baseQuery = baseQuery
        .where('userConnection.fromUser = :id', {
          id: fromUser.id,
        })
        .andWhere('userConnection.mutualConnection IS NOT NULL');
    } else if (connectionType === ConnectionType.Follower) {
      baseQuery = baseQuery.where('userConnection.toUser = :id', {
        id: fromUser.id,
      });
    } else {
      baseQuery = baseQuery.where('userConnection.fromUser = :id', {
        id: fromUser.id,
      });
      // FIXME: Fix this query
      // platformId &&
      //   (baseQuery = baseQuery.andWhere(
      //     'userConnection.toPlatformUser IS NOT NULL',
      //   ));
    }

    const [userConnections, totalCount] = await baseQuery
      .orderBy('userConnection.createdAt', 'DESC')
      .take(paginationParams.numItemsPerPage)
      .skip((paginationParams.page - 1) * paginationParams.numItemsPerPage)
      .getManyAndCount();

    debugger;

    return { userConnections, totalCount };
  }

  private async findUserConnectionOrThrow({
    id,
    fromUserId,
    toUserId,
  }: {
    id?: number;
    fromUserId?: number;
    toUserId?: number;
  }) {
    const findParameters = {};
    if (id) findParameters['id'] = id;
    if (fromUserId)
      findParameters['fromUser'] = await this.usersService.findOne(fromUserId);
    if (toUserId)
      findParameters['toUser'] = await this.usersService.findOne(toUserId);

    const userConnection = await this.userConnectionRepository.findOne(
      findParameters,
      { relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'] },
    );

    if (!userConnection) {
      throw new UserConnectionNotFoundException({ id });
    }
    return userConnection;
  }
}
