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
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

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
  AddNewPlatformToUserConnectionResponseDto,
  CreateUserConnectionResponseDto,
  FindAllUserConnectionResponseDto,
  FindOneUserConnectionResponseDto,
} from './dto/api-responses.dto';

@Controller({ version: '1', path: 'user-connections' })
export class UserConnectionsController {
  constructor(
    private readonly userConnectionsService: UserConnectionsService,
  ) {}

  @ApiOperation({ description: 'Creates a new user connection' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateUserConnectionResponseDto,
  })
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

  @ApiOperation({ description: 'List my connections' })
  @ApiQuery({ name: 'platformId', required: false, type: Number })
  @ApiQuery({ name: 'connectionType', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'numItemsPerPage', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindAllUserConnectionResponseDto,
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
  ): Promise<FindAllUserConnectionResponseDto> {
    return new FindAllUserConnectionResponseDto(
      await this.userConnectionsService.findMyUserConnections({
        userId: user.userId,
        connectionType,
        paginationParams: { page, numItemsPerPage },
        platformId,
      }),
    );
  }

  @ApiOperation({ description: 'Get connection by users' })
  @ApiQuery({
    name: 'fromUserId',
    required: false,
    example: 1234,
    type: Number,
  })
  @ApiQuery({ name: 'toUserId', required: false, example: 12345, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindOneUserConnectionResponseDto,
  })
  @Get('/by-users')
  async findOneByUserIds(
    @Query() { fromUserId, toUserId }: ByUserIdsParamsDto,
  ): Promise<FindOneUserConnectionResponseDto> {
    return new FindOneUserConnectionResponseDto(
      await this.userConnectionsService.findOneByUserIds(fromUserId, toUserId),
    );
  }

  @ApiOperation({ description: 'Get connection by id' })
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'User connection id',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindOneUserConnectionResponseDto,
  })
  @Get(':id')
  async findOne(
    @Param() { id }: UserConnectionParamsDto,
  ): Promise<FindOneUserConnectionResponseDto> {
    return new FindOneUserConnectionResponseDto(
      await this.userConnectionsService.findOne(id),
    );
  }

  @ApiOperation({
    description: 'Add a new platform to an existing user connection',
  })
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'User connection id',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: AddNewPlatformToUserConnectionResponseDto,
  })
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

  @ApiOperation({
    description: 'Delete platform from an existing user connection',
  })
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'User connection id',
    type: Number,
  })
  @ApiParam({
    name: 'platformId',
    required: true,
    example: 1,
    description: 'Platform id',
    type: Number,
  })
  @ApiResponse({ status: HttpStatus.OK })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/platforms/:platformId')
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
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'User connection id',
    type: Number,
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
