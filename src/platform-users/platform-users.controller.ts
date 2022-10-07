import {
  Delete,
  Get,
  HttpStatus,
  Controller,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { JwtClientCredentialsAuthGuard } from 'src/auth/guards/jwt-client-credentials-auth.guard';
import { JwtUserAuthGuard } from 'src/auth/guards/jwt-user-auth.guard';
import { PlatformRolesGuard } from 'src/auth/guards/platform-roles.guard';
import { ApiResponseInvalid } from 'src/common/serializers/decorators';
import { PaginationParamsDto } from 'src/common/serializers/pagination-params.dto';
import {
  FindAllPlatformUsersResponseEntity,
  SetPlatformUserRoleResponseEntity,
} from 'src/platforms/serializers/api-responses.entity';
import {
  PlatformIdParamDto,
  SetUserPlatformRoleParamsDto,
  SetUserPlatformRoleQueryParamsDto,
  RemovePlatformUserParamsDto,
} from 'src/platforms/serializers/api.dto';
import { UserRole } from 'src/roles/role.enum';
import { Roles } from 'src/roles/roles.decorator';
import { PlatformsService } from 'src/platforms/platforms.service';

@ApiTags('Platform users')
@Controller({ path: 'platform-users', version: '1' })
export class PlatformUsersController {
  constructor(private readonly platformsService: PlatformsService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List platform users',
    description:
      'Lists all platform users (requires client credential access).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindAllPlatformUsersResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @UseGuards(JwtClientCredentialsAuthGuard)
  // TODO: Convert these into params instead of using the path
  @Get(':platform_id/users')
  async findAllPlatformUsers(
    @Param() { platformId }: PlatformIdParamDto,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<FindAllPlatformUsersResponseEntity> {
    return plainToClass(
      FindAllPlatformUsersResponseEntity,
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
}
