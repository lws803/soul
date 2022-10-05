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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { JwtUserAuthGuard } from 'src/auth/guards/jwt-user-auth.guard';
import { ApiResponseInvalid } from 'src/common/serializers/decorators';

import { UserConnectionsService } from './user-connections.service';
import {
  CreateUserConnectionDto,
  UserConnectionParamsDto,
  PostPlatformDto,
  ByUserIdsParamsDto,
  FindMyUserConnectionsQueryParamsDto,
  RemovePlatformFromUserConnectionParamsDto,
} from './serializers/api.dto';
import {
  AddNewPlatformToUserConnectionResponseEntity,
  CreateUserConnectionResponseEntity,
  FindAllUserConnectionResponseEntity,
  FindOneUserConnectionResponseEntity,
} from './serializers/api-responses.entity';

@ApiTags('User connections')
@Controller({ version: '1', path: 'user-connections' })
export class UserConnectionsController {
  constructor(
    private readonly userConnectionsService: UserConnectionsService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create connection',
    description: 'Creates a new user connection from currently logged in user.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateUserConnectionResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtUserAuthGuard)
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my connections' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindAllUserConnectionResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtUserAuthGuard)
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

  @ApiOperation({ summary: 'Get connection (by users)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindOneUserConnectionResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.BAD_REQUEST,
  ])
  @Get('/by-users')
  async findOneByUserIds(
    @Query() { fromUserId, toUserId }: ByUserIdsParamsDto,
  ): Promise<FindOneUserConnectionResponseEntity> {
    return plainToClass(
      FindOneUserConnectionResponseEntity,
      await this.userConnectionsService.findOneByUserIds(fromUserId, toUserId),
    );
  }

  @ApiOperation({ summary: 'Get connection (by id)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindOneUserConnectionResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.BAD_REQUEST,
  ])
  @Get(':id')
  async findOne(
    @Param() { id }: UserConnectionParamsDto,
  ): Promise<FindOneUserConnectionResponseEntity> {
    return plainToClass(
      FindOneUserConnectionResponseEntity,
      await this.userConnectionsService.findOne(id),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Add a new platform to an existing user connection.',
    summary: 'Add platform to connection',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: AddNewPlatformToUserConnectionResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtUserAuthGuard)
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

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Delete platform from an existing user connection.',
    summary: 'Delete platform from connection',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtUserAuthGuard)
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

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Delete a user connection.',
    summary: 'Delete connection',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtUserAuthGuard)
  @Delete(':id')
  async remove(
    @Request() { user }: { user: JWTPayload },
    @Param() { id }: UserConnectionParamsDto,
  ) {
    await this.userConnectionsService.remove(id, user.userId);
  }
}
