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
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { UserConnectionsService } from './user-connections.service';
import {
  CreateUserConnectionDto,
  UserConnectionParamsDto,
  PostPlatformDto,
  ByUserIdsParamsDto,
  FindMyUserConnectionsQueryParamsDto,
  RemovePlatformFromUserConnectionParamsDto,
} from './dto/api.dto';
import {
  AddNewPlatformToUserConnectionResponseEntity,
  CreateUserConnectionResponseEntity,
  FindAllUserConnectionResponseEntity,
  FindOneUserConnectionResponseEntity,
} from './dto/api-responses.entity';

@Controller({ version: '1', path: 'user-connections' })
export class UserConnectionsController {
  constructor(
    private readonly userConnectionsService: UserConnectionsService,
  ) {}

  @ApiOperation({ description: 'Creates a new user connection' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateUserConnectionResponseEntity,
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() { user }: { user: JWTPayload },
    @Body() createConnectionDto: CreateUserConnectionDto,
  ): Promise<CreateUserConnectionResponseEntity> {
    return plainToClass(
      CreateUserConnectionResponseEntity,
      await this.userConnectionsService.create(
        user.userId,
        createConnectionDto,
      ),
    );
  }

  @ApiOperation({ description: 'List my connections' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindAllUserConnectionResponseEntity,
  })
  @UseGuards(JwtAuthGuard)
  @Get('/my-connections')
  async findMyConnections(
    @Request() { user }: { user: JWTPayload },
    @Query()
    {
      connectionType,
      platformId,
      page,
      numItemsPerPage,
    }: FindMyUserConnectionsQueryParamsDto,
  ): Promise<FindAllUserConnectionResponseEntity> {
    return plainToClass(
      FindAllUserConnectionResponseEntity,
      await this.userConnectionsService.findMyUserConnections({
        userId: user.userId,
        connectionType,
        paginationParams: { page, numItemsPerPage },
        platformId,
      }),
    );
  }

  @ApiOperation({ description: 'Get connection by users' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindOneUserConnectionResponseEntity,
  })
  @Get('/by-users')
  async findOneByUserIds(
    @Query() { fromUserId, toUserId }: ByUserIdsParamsDto,
  ): Promise<FindOneUserConnectionResponseEntity> {
    return plainToClass(
      FindOneUserConnectionResponseEntity,
      await this.userConnectionsService.findOneByUserIds(fromUserId, toUserId),
    );
  }

  @ApiOperation({ description: 'Get connection by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindOneUserConnectionResponseEntity,
  })
  @Get(':id')
  async findOne(
    @Param() { id }: UserConnectionParamsDto,
  ): Promise<FindOneUserConnectionResponseEntity> {
    return plainToClass(
      FindOneUserConnectionResponseEntity,
      await this.userConnectionsService.findOne(id),
    );
  }

  @ApiOperation({
    description: 'Add a new platform to an existing user connection',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: AddNewPlatformToUserConnectionResponseEntity,
  })
  @UseGuards(JwtAuthGuard)
  @Post(':id/platforms')
  async addNewPlatformToUserConnection(
    @Request() { user }: { user: JWTPayload },
    @Param() { id }: UserConnectionParamsDto,
    @Body() { platformId }: PostPlatformDto,
  ): Promise<AddNewPlatformToUserConnectionResponseEntity> {
    return plainToClass(
      AddNewPlatformToUserConnectionResponseEntity,
      await this.userConnectionsService.addNewPlatformToUserConnection(
        id,
        platformId,
        user.userId,
      ),
    );
  }

  @ApiOperation({
    description: 'Delete platform from an existing user connection',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/platforms/:platform_id')
  async removePlatformFromUserConnection(
    @Request() { user }: { user: JWTPayload },
    @Param() { id, platformId }: RemovePlatformFromUserConnectionParamsDto,
  ) {
    await this.userConnectionsService.removePlatformFromUserConnection(
      id,
      platformId,
      user.userId,
    );
  }

  @ApiOperation({
    description: 'Delete a user connection',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Request() { user }: { user: JWTPayload },
    @Param() { id }: UserConnectionParamsDto,
  ) {
    await this.userConnectionsService.remove(id, user.userId);
  }
}
