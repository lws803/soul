import { Injectable } from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { PaginationParamsDto } from 'src/common/serializers/pagination-params.dto';
import { ActivityService } from 'src/activity/activity.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateUserConnectionDto } from './serializers/api.dto';
import {
  UserConnectionNotFoundException,
  UserConnectionToSelfException,
  UserNotInvolvedInConnectionException,
  DuplicateUserConnectionException,
} from './exceptions';
import {
  CreateUserConnectionResponseEntity,
  FindAllUserConnectionResponseEntity,
  FindOneUserConnectionResponseEntity,
} from './serializers/api-responses.entity';
import { ConnectionType } from './enums/connection-type.enum';

@Injectable()
export class UserConnectionsService {
  constructor(
    private usersService: UsersService,
    private activityService: ActivityService,
    private prismaService: PrismaService,
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

    await this.throwOnDuplicate(
      currentUserId,
      createUserConnectionDto.toUserId,
    );

    const newConnection = await this.prismaService.userConnection.create({
      data: {
        fromUserId: fromUser.id,
        toUserId: toUser.id,
      },
      include: { fromUser: true, toUser: true },
    });
    const oppositeConnection =
      await this.prismaService.userConnection.findFirst({
        where: { fromUser: toUser, toUser: fromUser },
      });

    if (oppositeConnection) {
      await this.prismaService.userConnection.update({
        where: { id: oppositeConnection.id },
        data: { oppositeUserConnectionId: newConnection.id },
      });
      await this.prismaService.userConnection.update({
        where: { id: newConnection.id },
        data: { oppositeUserConnectionId: oppositeConnection.id },
      });
    }
    await this.activityService.sendFollowActivity({ fromUser, toUser });
    return { ...newConnection, isMutual: !!oppositeConnection };
  }

  async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<FindAllUserConnectionResponseEntity> {
    const userConnections = await this.prismaService.userConnection.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: paginationParams.numItemsPerPage,
      skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
      include: { fromUser: true, toUser: true },
    });
    const totalCount = await this.prismaService.userConnection.count();
    return { userConnections, totalCount };
  }

  async findOne(id: number): Promise<FindOneUserConnectionResponseEntity> {
    const userConnection = await this.findUserConnectionOrThrow({ id });

    return {
      ...userConnection,
      isMutual: !!userConnection.oppositeUserConnectionId,
    };
  }

  async findOneByUserIds(
    fromUserId: number,
    toUserId: number,
  ): Promise<FindOneUserConnectionResponseEntity> {
    const userConnection = await this.findUserConnectionOrThrow({
      fromUserId,
      toUserId,
    });

    return {
      ...userConnection,
      isMutual: !!userConnection.oppositeUserConnectionId,
    };
  }

  async remove(id: number, currentUserId: number) {
    const userConnection = await this.findUserConnectionOrThrow({ id });
    if (userConnection.fromUserId !== currentUserId) {
      throw new UserNotInvolvedInConnectionException();
    }
    await this.prismaService.userConnection.delete({ where: { id } });
  }

  async findMyUserConnections({
    userId,
    connectionType,
    paginationParams,
  }: {
    userId: number;
    connectionType: ConnectionType;
    paginationParams: PaginationParamsDto;
  }): Promise<FindAllUserConnectionResponseEntity> {
    const fromUser = await this.usersService.findOne(userId);

    const defaultArgs: Parameters<
      typeof this.prismaService.userConnection.findMany
    >[0] = {
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: paginationParams.numItemsPerPage,
      skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
    };

    if (connectionType === ConnectionType.Mutual) {
      const userConnections = await this.prismaService.userConnection.findMany({
        ...defaultArgs,
        where: { mutualConnection: { isNot: null }, fromUser },
        include: { fromUser: true, toUser: true, mutualConnection: true },
      });
      const totalCount = await this.prismaService.userConnection.count({
        where: { mutualConnection: { isNot: null }, fromUser },
      });

      return { userConnections, totalCount };
    }

    if (connectionType === ConnectionType.Follower) {
      const userConnections = await this.prismaService.userConnection.findMany({
        ...defaultArgs,
        where: { toUser: fromUser },
        include: { fromUser: true, toUser: true, mutualConnection: true },
      });
      const totalCount = await this.prismaService.userConnection.count({
        where: { toUser: fromUser },
      });
      return { userConnections, totalCount };
    }

    const userConnections = await this.prismaService.userConnection.findMany({
      ...defaultArgs,
      where: { fromUser },
      include: { fromUser: true, toUser: true, mutualConnection: true },
    });

    const totalCount = await this.prismaService.userConnection.count({
      where: { fromUser },
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
    const userConnection = await this.prismaService.userConnection.findFirst({
      where: {
        ...(fromUserId && {
          fromUser: await this.usersService.findOne(fromUserId),
        }),
        ...(toUserId && { toUser: await this.usersService.findOne(toUserId) }),
        ...(id && { id }),
      },
      include: { toUser: true, fromUser: true, mutualConnection: true },
    });

    if (!userConnection) {
      throw new UserConnectionNotFoundException({ id });
    }
    return userConnection;
  }

  private async throwOnDuplicate(fromUserId: number, toUserId: number) {
    const existingUserConnection =
      await this.prismaService.userConnection.findFirst({
        where: {
          fromUser: await this.usersService.findOne(fromUserId),
          toUser: await this.usersService.findOne(toUserId),
        },
      });
    if (existingUserConnection)
      throw new DuplicateUserConnectionException(fromUserId, toUserId);
  }
}
