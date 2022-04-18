import {
  Controller,
  Request,
  Post,
  UseGuards,
  Query,
  Body,
  Header,
} from '@nestjs/common';

import { User } from 'src/users/entities/user.entity';

import { AuthService } from './auth.service';
import {
  PlatformIdQueryDto,
  RefreshTokenBodyDto,
  CodeQueryParamDto,
  ValidateQueryParamDto,
} from './dto/api.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('login')
  async login(@Request() { user }: { user: User }) {
    return this.authService.login(user);
  }

  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('code')
  async code(
    @Request() { user }: { user: User },
    @Query() { platformId, callback }: CodeQueryParamDto,
  ) {
    return this.authService.getCodeForPlatformAndCallback(
      user,
      platformId,
      callback,
    );
  }

  @Post('verify')
  @Header('Cache-Control', 'no-store')
  verify(@Query() { code, callback }: ValidateQueryParamDto) {
    return this.authService.exchangeCodeForToken(code, callback);
  }

  @Post('refresh')
  @Header('Cache-Control', 'no-store')
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
