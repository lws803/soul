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
import { Roles } from 'src/roles/roles.decorator';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { UserRole } from 'src/roles/role.enum';
import { ApiResponseInvalid } from 'src/common/serializers/decorators';
import { JwtClientCredentialsAuthGuard } from 'src/auth/guards/jwt-client-credentials-auth.guard';

import { PlatformsService } from './platforms.service';
import * as api from './serializers/api.dto';
import * as apiResponses from './serializers/api-responses.entity';

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
    type: apiResponses.CreatePlatformResponseEntity,
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
    @Body() createPlatformDto: api.CreatePlatformDto,
  ): Promise<apiResponses.CreatePlatformResponseEntity> {
    return plainToClass(
      apiResponses.CreatePlatformResponseEntity,
      await this.platformsService.create(createPlatformDto, user.userId),
    );
  }

  @ApiOperation({
    description: 'List all platforms with pagination.',
    summary: 'List platforms',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindAllPlatformResponseEntity,
  })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST])
  @Get()
  async findAll(
    @Query() params: api.FindAllPlatformsQueryParamDto,
  ): Promise<apiResponses.FindAllPlatformResponseEntity> {
    return plainToClass(
      apiResponses.FindAllPlatformResponseEntity,
      await this.platformsService.findAll(params),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'List my platforms with pagination.',
    summary: 'List my platforms',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindAllPlatformResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
  ])
  @UseGuards(JwtUserAuthGuard)
  @Get('/my-platforms')
  async findMyPlatforms(
    @Request() { user }: { user: JWTPayload },
    @Query() params: api.FindMyPlatformsQueryParamDto,
  ): Promise<apiResponses.FindAllPlatformResponseEntity> {
    return plainToClass(
      apiResponses.FindAllPlatformResponseEntity,
      await this.platformsService.findMyPlatforms(params, user.userId),
    );
  }

  @ApiOperation({
    description: 'Find one platform from a given `platform_id`.',
    summary: 'Find platform by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindOnePlatformResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @Get(':platform_id')
  async findOne(
    @Param() { platformId }: api.PlatformIdParamDto,
  ): Promise<apiResponses.FindOnePlatformResponseEntity> {
    return plainToClass(
      apiResponses.FindOnePlatformResponseEntity,
      await this.platformsService.findOne(platformId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Find one platform with full details from a given `platform_id`.',
    summary: 'Find full platform by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindOnePlatformResponseEntity,
  })
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
    @Param() { platformId }: api.PlatformIdParamDto,
  ): Promise<apiResponses.FullPlatformResponseEntity> {
    return plainToClass(
      apiResponses.FullPlatformResponseEntity,
      await this.platformsService.findOne(platformId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Updates a platform (only authorized platform owners can update a platform).',
    summary: 'Update platform',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.UpdatePlatformResponseEntity,
  })
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
    @Param() { platformId }: api.PlatformIdParamDto,
    @Body() updatePlatformDto: api.UpdatePlatformDto,
  ): Promise<apiResponses.UpdatePlatformResponseEntity> {
    return plainToClass(
      apiResponses.UpdatePlatformResponseEntity,
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
  async remove(@Param() { platformId }: api.PlatformIdParamDto) {
    await this.platformsService.remove(platformId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Find one platform user',
    description: 'Find one platform user (requires client credential access).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindOneFullPlatformUserResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @UseGuards(JwtClientCredentialsAuthGuard)
  @Get(':platform_id/users/:user_id')
  async findOnePlatformUser(
    @Param() { platformId, userId }: api.FindOnePlatformUserParamDto,
  ): Promise<apiResponses.FindOneFullPlatformUserResponseEntity> {
    return plainToClass(
      apiResponses.FindOneFullPlatformUserResponseEntity,
      await this.platformsService.findOnePlatformUser(platformId, userId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Updates a platform membership (requires client credential access).',
    summary: 'Update platform membership',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindOneFullPlatformUserResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.BAD_REQUEST,
  ])
  @UseGuards(JwtClientCredentialsAuthGuard)
  @Patch(':platform_id/users/:user_id')
  async updatePlatformUser(
    @Param() params: api.FindOnePlatformUserParamDto,
    @Body() body: api.UpdatePlatformUserBodyDto,
  ): Promise<apiResponses.FindOneFullPlatformUserResponseEntity> {
    return plainToClass(
      apiResponses.FindOneFullPlatformUserResponseEntity,
      await this.platformsService.updateOnePlatformUser(params, body),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List platform users',
    description:
      'Lists all platform users (requires client credential access).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponses.FindAllFullPlatformUsersResponseEntity,
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
    @Param() { platformId }: api.PlatformIdParamDto,
    @Query() params: api.ListAllPlatformUsersQueryParamDto,
  ): Promise<apiResponses.FindAllFullPlatformUsersResponseEntity> {
    return plainToClass(
      apiResponses.FindAllFullPlatformUsersResponseEntity,
      await this.platformsService.findAllPlatformUsers({
        platformId,
        params,
      }),
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
    @Param() { platformId, userId }: api.RemovePlatformUserParamsDto,
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
    @Param() { platformId }: api.PlatformIdParamDto,
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
    type: apiResponses.CreatePlatformUserResponseEntity,
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
    @Param() { platformId }: api.PlatformIdParamDto,
  ): Promise<apiResponses.CreatePlatformUserResponseEntity> {
    return plainToClass(
      apiResponses.CreatePlatformUserResponseEntity,
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
    type: apiResponses.FullPlatformResponseEntity,
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
    @Param() { platformId }: api.PlatformIdParamDto,
  ): Promise<apiResponses.FullPlatformResponseEntity> {
    return plainToClass(
      apiResponses.FullPlatformResponseEntity,
      await this.platformsService.generateClientSecret(platformId),
    );
  }
}
