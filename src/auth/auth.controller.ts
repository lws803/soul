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

import { User } from 'src/users/entities/user.entity';

import { AuthService } from './auth.service';
import {
  CodeResponseDto,
  LoginResponseDto,
  PlatformLoginResponseDto,
  RefreshTokenResponseDto,
  RefreshTokenWithPlatformResponseDto,
} from './dto/api-responses.dto';
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
  @ApiResponse({ status: HttpStatus.CREATED, type: LoginResponseDto })
  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('login')
  async login(@Request() { user }: { user: User }): Promise<LoginResponseDto> {
    return new LoginResponseDto(await this.authService.login(user));
  }

  @ApiOperation({
    description:
      'Login with external platform, returns code to be exchanged for a token',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: CodeResponseDto })
  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('code')
  async code(
    @Request() { user }: { user: User },
    @Query() queryArgs: CodeQueryParamDto,
  ): Promise<CodeResponseDto> {
    return new CodeResponseDto(
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
  @ApiResponse({ status: HttpStatus.CREATED, type: PlatformLoginResponseDto })
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async verify(
    @Body() args: ValidateBodyDto,
  ): Promise<PlatformLoginResponseDto> {
    return new PlatformLoginResponseDto(
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
    type: RefreshTokenWithPlatformResponseDto,
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Body() { refreshToken, platformId }: RefreshTokenBodyDto,
  ): Promise<RefreshTokenWithPlatformResponseDto | RefreshTokenResponseDto> {
    if (platformId) {
      return new RefreshTokenWithPlatformResponseDto(
        await this.authService.refreshWithPlatform(refreshToken, platformId),
      );
    }
    return new RefreshTokenResponseDto(
      await this.authService.refresh(refreshToken),
    );
  }
}
