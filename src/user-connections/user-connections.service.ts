import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  Not,
  QueryFailedError,
  Repository,
  OrderByCondition,
  In,
} from 'typeorm';

import { UsersService } from 'src/users/users.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';

import { CreateUserConnectionDto } from './dto/api.dto';
import { UserConnection } from './entities/user-connection.entity';
import {
  UserConnectionNotFoundException,
  UserConnectionToSelfException,
  UserNotInvolvedInConnectionException,
  DuplicateUserConnectionException,
} from './exceptions';
import {
  AddNewPlatformToUserConnectionResponseDto,
  CreateUserConnectionResponseDto,
  FindAllUserConnectionResponseDto,
  FindOneUserConnectionResponseDto,
} from './dto/api-responses.dto';
import { ConnectionType } from './enums/connection-type.enum';

@Injectable()
export class UserConnectionsService {
  constructor(
    @InjectRepository(UserConnection)
    private userConnectionRepository: Repository<UserConnection>,
    private usersService: UsersService,
    private platformService: PlatformsService,
  ) {}

  async create(
    currentUserId: number,
    createUserConnectionDto: CreateUserConnectionDto,
  ): Promise<CreateUserConnectionResponseDto> {
    if (
      createUserConnectionDto.fromUserId === createUserConnectionDto.toUserId
    ) {
      throw new UserConnectionToSelfException();
    }
    if (createUserConnectionDto.fromUserId !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }

    const fromUser = await this.usersService.findOne(
      createUserConnectionDto.fromUserId,
    );
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
      return { ...currentConnection, isMutual: !!oppositeConnection };
    } catch (exception) {
      if (exception instanceof QueryFailedError) {
        if (exception.driverError.code === 'ER_DUP_ENTRY') {
          throw new DuplicateUserConnectionException(
            createUserConnectionDto.fromUserId,
            createUserConnectionDto.toUserId,
          );
        }
        throw exception;
      }
    }
  }

  async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<FindAllUserConnectionResponseDto> {
    const [userConnections, totalCount] =
      await this.userConnectionRepository.findAndCount({
        order: { id: 'ASC' },
        take: paginationParams.numItemsPerPage,
        skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
        relations: ['platforms', 'fromUser', 'toUser'],
      });
    return { userConnections, totalCount };
  }

  async findOne(id: number): Promise<FindOneUserConnectionResponseDto> {
    const userConnection = await this.findUserConnectionOrThrow({ id });
    return userConnection;
  }

  async findOneByUserIds(
    fromUserId: number,
    toUserId: number,
  ): Promise<FindOneUserConnectionResponseDto> {
    const userConnection = await this.findUserConnectionOrThrow({
      fromUserId,
      toUserId,
    });
    return userConnection;
  }

  async remove(id: number, currentUserId: number) {
    const userConnection = await this.findUserConnectionOrThrow({ id });
    if (userConnection.fromUser.id !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }
    await this.userConnectionRepository.delete({ id });
  }

  async addNewPlatformToUserConnection(
    id: number,
    platformId: number,
    currentUserId: number,
  ): Promise<AddNewPlatformToUserConnectionResponseDto> {
    const userConnection = await this.findUserConnectionOrThrow({
      id,
    });
    if (userConnection.fromUser.id !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }
    const platform = await this.platformService.findOne(platformId);
    userConnection.platforms = Array.from(
      new Set([...userConnection.platforms, platform]),
    );
    return await this.userConnectionRepository.save(userConnection);
  }

  async removePlatformFromUserConnection(
    id: number,
    platformId: number,
    currentUserId: number,
  ) {
    const userConnection = await this.findUserConnectionOrThrow({
      id,
    });
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
    const order: OrderByCondition = { id: 'ASC' };
    const defaultArgs = {
      order,
      take: paginationParams.numItemsPerPage,
      skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
      relations: ['platforms', 'fromUser', 'toUser', 'mutualConnection'],
    };
    let where: any = { fromUser };

    if (platformId) {
      const platform = await this.platformService.findOne(platformId);
      const userConnectionIds = platform.userConnections.map(
        (userConnection) => userConnection.id,
      );
      where['id'] = In(userConnectionIds);
    }

    if (connectionType === ConnectionType.Mutual) {
      where = { mutualConnection: Not(IsNull()), fromUser };
    } else if (connectionType === ConnectionType.Follower) {
      where = { toUser: fromUser };
    }
    const [userConnections, totalCount] =
      await this.userConnectionRepository.findAndCount({
        ...defaultArgs,
        where,
      });
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
