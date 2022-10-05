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
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { User } from 'src/users/entities/user.entity';
import { ApiResponseInvalid } from 'src/common/serializers/decorators';

import { AuthService } from './auth.service';
import {
  ClientAuthenticateResponseEntity,
  CodeResponseEntity,
  LoginResponseEntity,
  PlatformLoginResponseEntity,
  RefreshTokenWithPlatformResponseEntity,
} from './serializers/api-responses.entity';
import {
  RefreshTokenBodyDto,
  CodeQueryParamDto,
  ValidateBodyDto,
  AuthenticateClientBodyDto,
} from './serializers/api.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Auth')
@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiExcludeEndpoint()
  @ApiOperation({
    description: 'Login with email and password.',
    summary: 'Login',
  })
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

  @ApiExcludeEndpoint()
  @ApiOperation({
    description:
      'Login with external platform, returns code to be exchanged for a token.',
    summary: 'Platform login',
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
      'Verify code returned to external platform and exchange for access tokens.',
    summary: 'Verify platform login',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PlatformLoginResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @HttpCode(HttpStatus.OK)
  @Post('verify')
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
      'Note that the existing refresh token will no longer be usable.',
    summary: 'Refresh access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RefreshTokenWithPlatformResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Body() { refreshToken, platformId }: RefreshTokenBodyDto,
  ): Promise<RefreshTokenWithPlatformResponseEntity> {
    return plainToClass(
      RefreshTokenWithPlatformResponseEntity,
      await this.authService.refreshWithPlatform(refreshToken, platformId),
    );
  }

  @ApiOperation({
    description:
      'Authenticate client with client credentials flow using a client secret. ' +
      'A client secret must be set before this.',
    summary: 'Authenticate client',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClientAuthenticateResponseEntity,
  })
  @ApiResponseInvalid([
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  ])
  @HttpCode(HttpStatus.OK)
  @Post('authenticate-client')
  @Header('Cache-Control', 'no-store')
  async authenticateClient(
    @Body() { platformId, clientSecret }: AuthenticateClientBodyDto,
  ): Promise<ClientAuthenticateResponseEntity> {
    return plainToClass(
      ClientAuthenticateResponseEntity,
      await this.authService.authenticateClient(platformId, clientSecret),
    );
  }
}
