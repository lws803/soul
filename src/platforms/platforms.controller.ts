import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';
import { Roles } from 'src/roles/roles.decorator';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { PlatformRolesGuard } from 'src/roles/platform-roles.guard';
import { UserRole } from 'src/roles/role.enum';

import { PlatformsService } from './platforms.service';
import {
  UpdatePlatformDto,
  CreatePlatformDto,
  PlatformIdParamDto,
  RemovePlatformUserParamsDto,
  SetUserPlatformRoleParamsDto,
  SetUserPlatformRoleQueryParamsDto,
  FindAllPlatformsQueryParamDto,
} from './dto/api.dto';
import {
  CreatePlatformResponseDto,
  CreatePlatformUserResponseDto,
  FindAllPlatformResponseDto,
  FindAllPlatformUsersResponseDto,
  FindOnePlatformResponseDto,
  SetPlatformUserRoleResponseDto,
  UpdatePlatformResponseDto,
} from './dto/api-responses.dto';

@Controller({ path: 'platforms', version: '1' })
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @ApiOperation({ description: 'Create a new platform' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreatePlatformResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() { user }: { user: JWTPayload },
    @Body() createPlatformDto: CreatePlatformDto,
  ): Promise<CreatePlatformResponseDto> {
    return new CreatePlatformResponseDto(
      await this.platformsService.create(createPlatformDto, user.userId),
    );
  }

  @ApiOperation({ description: 'List all platforms with pagination support' })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllPlatformResponseDto })
  @Get()
  async findAll(
    @Query() params: FindAllPlatformsQueryParamDto,
  ): Promise<FindAllPlatformResponseDto> {
    return new FindAllPlatformResponseDto(
      await this.platformsService.findAll(params),
    );
  }

  @ApiOperation({ description: 'Find one platform from a given platformId' })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, type: FindOnePlatformResponseDto })
  @Get(':platformId')
  async findOne(
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<FindOnePlatformResponseDto> {
    return new FindOnePlatformResponseDto(
      await this.platformsService.findOne(platformId),
    );
  }

  @ApiOperation({
    description:
      'Updates a platform (only authorized platform owners can update a platform)',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, type: UpdatePlatformResponseDto })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Patch(':platformId')
  async update(
    @Param() { platformId }: PlatformIdParamDto,
    @Body() updatePlatformDto: UpdatePlatformDto,
  ): Promise<UpdatePlatformResponseDto> {
    return new UpdatePlatformResponseDto(
      await this.platformsService.update(platformId, updatePlatformDto),
    );
  }

  @ApiOperation({
    description:
      'Deletes a platform (only authorized platform owners can delete a platform)',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiResponse({ status: HttpStatus.OK })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platformId')
  async remove(@Param() { platformId }: PlatformIdParamDto) {
    await this.platformsService.remove(platformId);
  }

  @ApiOperation({
    description: 'Lists all platform users',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllPlatformUsersResponseDto })
  @Roles(UserRole.MEMBER)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Get(':platformId/users')
  async findAllPlatformUsers(
    @Param() { platformId }: PlatformIdParamDto,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<FindAllPlatformUsersResponseDto> {
    return new FindAllPlatformUsersResponseDto(
      await this.platformsService.findAllPlatformUsers(
        platformId,
        paginationParams,
      ),
    );
  }

  @ApiOperation({
    description: 'Sets a role for a user on a platform',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiParam({ name: 'userId', example: 1234 })
  @ApiQuery({ name: 'roles', example: 'admin,member' })
  @ApiResponse({ status: HttpStatus.OK, type: SetPlatformUserRoleResponseDto })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Put(':platformId/users/:userId')
  async setPlatformUserRole(
    @Param() { platformId, userId }: SetUserPlatformRoleParamsDto,
    @Query() { roles }: SetUserPlatformRoleQueryParamsDto,
  ): Promise<SetPlatformUserRoleResponseDto> {
    return new SetPlatformUserRoleResponseDto(
      await this.platformsService.setUserRole(platformId, userId, roles),
    );
  }

  @ApiOperation({
    description: 'Deletes a user from a platform',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiParam({ name: 'userId', example: 1234 })
  @ApiResponse({ status: HttpStatus.OK })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platformId/users/:userId')
  async removePlatformUser(
    @Param() { platformId, userId }: RemovePlatformUserParamsDto,
  ) {
    await this.platformsService.removeUser(platformId, userId);
  }

  @ApiOperation({
    description: 'Quits a platform by deleting self from it',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiResponse({ status: HttpStatus.OK })
  @Roles(UserRole.MEMBER)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platformId/quit')
  async removeMyself(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    await this.platformsService.removeUser(platformId, user.userId);
  }

  @ApiOperation({
    description: 'Joins a platform by adding self to it',
  })
  @ApiParam({ name: 'platformId', example: 1 })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreatePlatformUserResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Post(':platformId/join')
  async joinPlatform(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<CreatePlatformUserResponseDto> {
    return new CreatePlatformUserResponseDto(
      await this.platformsService.addUser(platformId, user.userId),
    );
  }
}
