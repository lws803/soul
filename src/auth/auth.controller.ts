import {
  Controller,
  Request,
  Post,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';

import { User } from 'src/users/entities/user.entity';

import { AuthService } from './auth.service';
import { PlatformIdQueryDto, RefreshTokenBodyDto } from './dto/api.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() { user }: { user: User },
    @Query() { platformId }: PlatformIdQueryDto,
  ) {
    if (platformId) {
      return this.authService.loginWithPlatform(user, platformId);
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(
    @Query() { platformId }: PlatformIdQueryDto,
    @Body() { refreshToken }: RefreshTokenBodyDto,
  ) {
    if (platformId) {
      return this.authService.refreshWithPlatform(refreshToken, platformId);
    }
    return this.authService.refresh(refreshToken);
  }
}
