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
} from '@nestjs/common';

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
  RemovePLatformUserParamsDto,
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

  @Get()
  async findAll(
    @Query() params: FindAllPlatformsQueryParamDto,
  ): Promise<FindAllPlatformResponseDto> {
    return new FindAllPlatformResponseDto(
      await this.platformsService.findAll(params),
    );
  }

  @Get(':platformId')
  async findOne(
    @Param() { platformId }: PlatformIdParamDto,
  ): Promise<FindOnePlatformResponseDto> {
    return new FindOnePlatformResponseDto(
      await this.platformsService.findOne(platformId),
    );
  }

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

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platformId')
  async remove(@Param() { platformId }: PlatformIdParamDto) {
    await this.platformsService.remove(platformId);
  }

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

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platformId/users/:userId')
  async removePlatformUser(
    @Param() { platformId, userId }: RemovePLatformUserParamsDto,
  ) {
    await this.platformsService.removeUser(platformId, userId);
  }

  @Roles(UserRole.MEMBER)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @Delete(':platformId/quit')
  async removeMyself(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    await this.platformsService.removeUser(platformId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':platformId/join')
  async joinPlatform(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    return new CreatePlatformUserResponseDto(
      await this.platformsService.addUser(platformId, user.userId),
    );
  }
}
