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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { JwtUserAuthGuard } from 'src/auth/guards/jwt-user-auth.guard';
import { PlatformRolesGuard } from 'src/auth/guards/platform-roles.guard';
import { PaginationParamsDto } from 'src/common/serializers/pagination-params.dto';
import { Roles } from 'src/roles/roles.decorator';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { UserRole } from 'src/roles/role.enum';
import { ApiResponseInvalid } from 'src/common/serializers/decorators';
import { JwtClientCredentialsAuthGuard } from 'src/auth/guards/jwt-client-credentials-auth.guard';

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
} from './serializers/api.dto';
import {
  CreatePlatformResponseEntity,
  CreatePlatformUserResponseEntity,
  FindAllPlatformResponseEntity,
  FindAllFullPlatformUsersResponseEntity,
  FindOnePlatformResponseEntity,
  FullPlatformResponseEntity,
  SetPlatformUserRoleResponseEntity,
  UpdatePlatformResponseEntity,
} from './serializers/api-responses.entity';

@ApiTags('Platforms')
@Controller({ path: 'platforms', version: '1' })
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Create a new platform.',
    summary: 'Create platform',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreatePlatformResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.CONFLICT,
  ])
  @UseGuards(JwtUserAuthGuard)
  @Post()
  async create(
    @Request() { user }: { user: JWTPayload },
    @Body() createPlatformDto: CreatePlatformDto,
  ): Promise<CreatePlatformResponseEntity> {
    return plainToClass(
      CreatePlatformResponseEntity,
      await this.platformsService.create(createPlatformDto, user.userId),
    );
  }

  @ApiOperation({
    description: 'List all platforms with pagination.',
    summary: 'List platforms',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllPlatformResponseEntity })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST])
  @Get()
  async findAll(
    @Query() params: FindAllPlatformsQueryParamDto,
  ): Promise<FindAllPlatformResponseEntity> {
    return plainToClass(
      FindAllPlatformResponseEntity,
      await this.platformsService.findAll(params),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'List my platforms with pagination.',
    summary: 'List my platforms',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllPlatformResponseEntity })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
  ])
  @UseGuards(JwtUserAuthGuard)
  @Get('/my-platforms')
  async findMyPlatforms(
    @Request() { user }: { user: JWTPayload },
    @Query() params: FindMyPlatformsQueryParamDto,
  ): Promise<FindAllPlatformResponseEntity> {
    return plainToClass(
      FindAllPlatformResponseEntity,
      await this.platformsService.findMyPlatforms(params, user.userId),
    );
  }

  @ApiOperation({
    description: 'Find one platform from a given `platform_id`.',
    summary: 'Find platform by id',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindOnePlatformResponseEntity })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Get(':platform_id')
  async findOne(
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<FindOnePlatformResponseEntity> {
    return plainToClass(
      FindOnePlatformResponseEntity,
      await this.platformsService.findOne(platformId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Find one platform with full details from a given `platform_id`.',
    summary: 'Find full platform by id',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindOnePlatformResponseEntity })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Roles(UserRole.Admin)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Get(':platform_id/full')
  async findOneFull(
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<FullPlatformResponseEntity> {
    return plainToClass(
      FullPlatformResponseEntity,
      await this.platformsService.findOne(platformId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Updates a platform (only authorized platform owners can update a platform).',
    summary: 'Update platform',
  })
  @ApiResponse({ status: HttpStatus.OK, type: UpdatePlatformResponseEntity })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Roles(UserRole.Admin)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Patch(':platform_id')
  async update(
    @Param() { platformId }: PlatformIdParamDto,
    @Body() updatePlatformDto: UpdatePlatformDto,
  ): Promise<UpdatePlatformResponseEntity> {
    return plainToClass(
      UpdatePlatformResponseEntity,
      await this.platformsService.update(platformId, updatePlatformDto),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Deletes a platform (only authorized platform owners can delete a platform).',
    summary: 'Delete platform',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Roles(UserRole.Admin)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Delete(':platform_id')
  async remove(@Param() { platformId }: PlatformIdParamDto) {
    await this.platformsService.remove(platformId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List platform users',
    description:
      'Lists all platform users (requires client credential access).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindAllFullPlatformUsersResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @UseGuards(JwtClientCredentialsAuthGuard)
  @Get(':platform_id/users')
  async findAllPlatformUsers(
    @Param() { platformId }: PlatformIdParamDto,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<FindAllFullPlatformUsersResponseEntity> {
    return plainToClass(
      FindAllFullPlatformUsersResponseEntity,
      await this.platformsService.findAllPlatformUsers({
        platformId,
        paginationParams,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Sets a role for a user on a platform.',
    summary: 'Set role for user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SetPlatformUserRoleResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Roles(UserRole.Admin)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Put(':platform_id/users/:user_id')
  async setPlatformUserRole(
    @Param() { platformId, userId }: SetUserPlatformRoleParamsDto,
    @Query() { roles }: SetUserPlatformRoleQueryParamsDto,
  ): Promise<SetPlatformUserRoleResponseEntity> {
    return plainToClass(
      SetPlatformUserRoleResponseEntity,
      await this.platformsService.setUserRole(platformId, userId, roles),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Deletes a user from a platform.',
    summary: 'Delete platform user',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Roles(UserRole.Admin)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Delete(':platform_id/users/:user_id')
  async removePlatformUser(
    @Param() { platformId, userId }: RemovePlatformUserParamsDto,
  ) {
    await this.platformsService.removeUser(platformId, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Quits a platform by deleting self from it.',
    summary: 'Quit platform',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.BAD_REQUEST,
  ])
  @Roles(UserRole.Member)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Delete(':platform_id/quit')
  async removeMyself(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    await this.platformsService.removeUser(platformId, user.userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Joins a platform by adding self to it.',
    summary: 'Join platform',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreatePlatformUserResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtUserAuthGuard)
  @Post(':platform_id/join')
  async joinPlatform(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<CreatePlatformUserResponseEntity> {
    return plainToClass(
      CreatePlatformUserResponseEntity,
      await this.platformsService.addUser(platformId, user.userId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Generates a new client secret for the specified platform.',
    summary: 'Generate new client secret',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FullPlatformResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Roles(UserRole.Admin)
  @UseGuards(JwtUserAuthGuard, PlatformRolesGuard)
  @Patch(':platform_id/generate-new-client-secret')
  async generateNewClientSecret(
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<FullPlatformResponseEntity> {
    return plainToClass(
      FullPlatformResponseEntity,
      await this.platformsService.generateClientSecret(platformId),
    );
  }
}
