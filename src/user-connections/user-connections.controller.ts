import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';

import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { UserConnectionsService } from './user-connections.service';
import {
  CreateUserConnectionDto,
  PlatformIdParamDto,
  UserConnectionParamsDto,
  PostPlatformDto,
  ByUserIdsParamsDto,
  FindMyUserConnectionsQueryParamsDto,
} from './dto/api.dto';
import {
  AddNewPlatformToUserConnectionResponseDto,
  CreateUserConnectionResponseDto,
  FindAllUserConnectionResponseDto,
  FindOneUserConnectionResponseDto,
} from './dto/api-responses.dto';

@Controller({ version: '1', path: 'user_connections' })
export class UserConnectionsController {
  constructor(
    private readonly userConnectionsService: UserConnectionsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() { user }: { user: JWTPayload },
    @Body() createConnectionDto: CreateUserConnectionDto,
  ): Promise<CreateUserConnectionResponseDto> {
    return new CreateUserConnectionResponseDto(
      await this.userConnectionsService.create(
        user.userId,
        createConnectionDto,
      ),
    );
  }

  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<FindAllUserConnectionResponseDto> {
    return new FindAllUserConnectionResponseDto(
      await this.userConnectionsService.findAll(paginationParams),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my_connections')
  async findMyConnections(
    @Request() { user }: { user: JWTPayload },
    @Query() paginationParams: PaginationParamsDto,
    @Query()
    { connectionType, platformId }: FindMyUserConnectionsQueryParamsDto,
  ): Promise<FindAllUserConnectionResponseDto> {
    return new FindAllUserConnectionResponseDto(
      await this.userConnectionsService.findMyUserConnections({
        userId: user.userId,
        connectionType,
        paginationParams,
        platformId,
      }),
    );
  }

  @Get('/by_users')
  async findOneByUserIds(
    @Query() { fromUserId, toUserId }: ByUserIdsParamsDto,
  ): Promise<FindOneUserConnectionResponseDto> {
    return new FindOneUserConnectionResponseDto(
      await this.userConnectionsService.findOneByUserIds(fromUserId, toUserId),
    );
  }

  @Get(':id')
  async findOne(
    @Param() { id }: UserConnectionParamsDto,
  ): Promise<FindOneUserConnectionResponseDto> {
    return new FindOneUserConnectionResponseDto(
      await this.userConnectionsService.findOne(id),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/platforms')
  async addNewPlatformToUserConnection(
    @Request() { user }: { user: JWTPayload },
    @Param() { id }: UserConnectionParamsDto,
    @Body() { platformId }: PostPlatformDto,
  ): Promise<AddNewPlatformToUserConnectionResponseDto> {
    return new AddNewPlatformToUserConnectionResponseDto(
      await this.userConnectionsService.addNewPlatformToUserConnection(
        id,
        platformId,
        user.userId,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/platforms/:platformId')
  removePlatformFromUserConnection(
    @Request() { user }: { user: JWTPayload },
    @Param() { id }: UserConnectionParamsDto,
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    return this.userConnectionsService.removePlatformFromUserConnection(
      id,
      platformId,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Request() { user }: { user: JWTPayload },
    @Param() { id }: UserConnectionParamsDto,
  ) {
    return this.userConnectionsService.remove(id, user.userId);
  }
}
