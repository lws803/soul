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
  ByUserIdsParamsDto,
  FindMyUserConnectionsQueryParamsDto,
} from './serializers/api.dto';
import {
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
