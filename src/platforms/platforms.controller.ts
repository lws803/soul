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
import { RolesGuard } from 'src/roles/roles.guard';
import { UserRole } from 'src/roles/role.enum';

import { PlatformsService } from './platforms.service';
import {
  UpdatePlatformDto,
  CreatePlatformDto,
  PlatformIdParamDto,
  RemovePLatformUserParamsDto,
  SetUserPlatformRoleParamsDto,
  SetUserPlatformRoleQueryParamsDto,
} from './dto/api.dto';
import {
  CreatePlatformResponseDto,
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
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<FindAllPlatformResponseDto> {
    return new FindAllPlatformResponseDto(
      await this.platformsService.findAll(paginationParams),
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':platformId')
  remove(@Param() { platformId }: PlatformIdParamDto) {
    return this.platformsService.remove(platformId);
  }

  @Roles(UserRole.MEMBER)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':platformId/users/:userId')
  removePlatformUser(
    @Param() { platformId, userId }: RemovePLatformUserParamsDto,
  ) {
    return this.platformsService.removeUser(platformId, userId);
  }

  @Roles(UserRole.MEMBER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':platformId/quit')
  removeMyself(
    @Request() { user }: { user: JWTPayload },
    @Param() { platformId }: PlatformIdParamDto,
  ) {
    return this.platformsService.removeUser(platformId, user.userId);
  }
}
