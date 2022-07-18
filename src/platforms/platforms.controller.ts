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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

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
  FindMyPlatformsQueryParamDto,
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

  @ApiOperation({
    description: 'List my platforms with pagination support',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllPlatformResponseDto })
  @UseGuards(JwtAuthGuard)
  @Get('/my-platforms')
  async findMyPlatforms(
    @Request() { user }: { user: JWTPayload },
    @Query() params: FindMyPlatformsQueryParamDto,
  ): Promise<FindAllPlatformResponseDto> {
    // TODO: Add unit tests
    return new FindAllPlatformResponseDto(
      await this.platformsService.findMyPlatforms(params, user.userId),
    );
  }

  @ApiOperation({ description: 'Find one platform from a given platformId' })
  @ApiResponse({ status: HttpStatus.OK, type: FindOnePlatformResponseDto })
  @Get(':platform_id')
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
  @ApiResponse({ status: HttpStatus.OK, type: UpdatePlatformResponseDto })
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Patch(':platform_id')
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
  @ApiResponse({ status: HttpStatus.OK })
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platform_id')
  async remove(@Param() { platformId }: PlatformIdParamDto) {
    await this.platformsService.remove(platformId);
  }

  @ApiOperation({
    description: 'Lists all platform users',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllPlatformUsersResponseDto })
  @Roles(UserRole.Member)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Get(':platform_id/users')
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
  @ApiResponse({ status: HttpStatus.OK, type: SetPlatformUserRoleResponseDto })
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Put(':platform_id/users/:user_id')
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
  @ApiResponse({ status: HttpStatus.OK })
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platform_id/users/:user_id')
  async removePlatformUser(
    @Param() { platformId, userId }: RemovePlatformUserParamsDto,
  ) {
    await this.platformsService.removeUser(platformId, userId);
  }

  @ApiOperation({
    description: 'Quits a platform by deleting self from it',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @Roles(UserRole.Member)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platform_id/quit')
  async removeMyself(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    await this.platformsService.removeUser(platformId, user.userId);
  }

  @ApiOperation({
    description: 'Joins a platform by adding self to it',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreatePlatformUserResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Post(':platform_id/join')
  async joinPlatform(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<CreatePlatformUserResponseDto> {
    return new CreatePlatformUserResponseDto(
      await this.platformsService.addUser(platformId, user.userId),
    );
  }
}
