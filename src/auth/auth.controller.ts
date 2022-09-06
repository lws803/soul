import {
  Controller,
  Request,
  Post,
  UseGuards,
  Query,
  Body,
  Header,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { User } from 'src/users/entities/user.entity';

import { AuthService } from './auth.service';
import {
  CodeResponseEntity,
  LoginResponseEntity,
  PlatformLoginResponseEntity,
  RefreshTokenResponseEntity,
  RefreshTokenWithPlatformResponseEntity,
} from './dto/api-responses.entity';
import {
  RefreshTokenBodyDto,
  CodeQueryParamDto,
  ValidateBodyDto,
} from './dto/api.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiExcludeEndpoint()
  @ApiOperation({ description: 'Login with email and password' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LoginResponseEntity })
  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('login')
  async login(
    @Request() { user }: { user: User },
  ): Promise<LoginResponseEntity> {
    return plainToClass(
      LoginResponseEntity,
      await this.authService.login(user),
    );
  }

  @ApiOperation({
    description:
      'Login with external platform, returns code to be exchanged for a token',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: CodeResponseEntity })
  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('code')
  async code(
    @Request() { user }: { user: User },
    @Query() queryArgs: CodeQueryParamDto,
  ): Promise<CodeResponseEntity> {
    return plainToClass(
      CodeResponseEntity,
      await this.authService.findCodeForPlatformAndCallback({
        user,
        ...queryArgs,
      }),
    );
  }

  @ApiOperation({
    description:
      'Verify code returned to external platform and exchange for access tokens',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PlatformLoginResponseEntity,
  })
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async verify(
    @Body() args: ValidateBodyDto,
  ): Promise<PlatformLoginResponseEntity> {
    return plainToClass(
      PlatformLoginResponseEntity,
      await this.authService.exchangeCodeForToken(args),
    );
  }

  @ApiOperation({
    description:
      'Refresh access token, returns new access token and a new refresh token. ' +
      'If client_id is provided, returns new access token for that platform. ' +
      'Note that the existing refresh token will no longer be usable.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: RefreshTokenWithPlatformResponseEntity,
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Body() { refreshToken, platformId }: RefreshTokenBodyDto,
  ): Promise<
    RefreshTokenWithPlatformResponseEntity | RefreshTokenResponseEntity
  > {
    if (platformId) {
      return plainToClass(
        RefreshTokenWithPlatformResponseEntity,
        await this.authService.refreshWithPlatform(refreshToken, platformId),
      );
    }
    return plainToClass(
      RefreshTokenResponseEntity,
      await this.authService.refresh(refreshToken),
    );
  }
}
