import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { SkipThrottle } from '@nestjs/throttler';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';
import { ApiResponseInvalid } from 'src/common/serializers/decorators';
import { DisableForPlatformUsersGuard } from 'src/auth/guards/disable-for-platform-users.guard';

import { UsersService } from './users.service';
import {
  CreateUserDto,
  FindAllUsersQueryParamDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  ResendConfirmationTokenDto,
  TokenQueryParamDto,
  UpdateUserDto,
  UserParamsDto,
} from './serializers/api.dto';
import {
  CreateUserResponseEntity,
  FindAllUserResponseEntity,
  FindOneUserResponseEntity,
  FindMeResponseEntity,
  UpdateUserResponseEntity,
} from './serializers/api-responses.entity';

@ApiTags('Users')
@Controller({ version: '1', path: 'users' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ description: 'Creates a new user.', summary: 'Create user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateUserResponseEntity })
  @ApiResponseInvalid([HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST])
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponseEntity> {
    return plainToClass(
      CreateUserResponseEntity,
      await this.usersService.create(createUserDto),
    );
  }

  @ApiOperation({ description: 'Lists all users.', summary: 'List users' })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllUserResponseEntity })
  @ApiResponseInvalid([HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST])
  @Get()
  async findAll(
    @Query() queryParams: FindAllUsersQueryParamDto,
  ): Promise<FindAllUserResponseEntity> {
    return plainToClass(
      FindAllUserResponseEntity,
      await this.usersService.findAll(queryParams),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'Retrieves information about myself, requires auth bearer token.',
    summary: 'Retrieve myself',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindMeResponseEntity })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED], {
    isRateLimited: false,
  })
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Get('me')
  async findMe(
    @Request() { user }: { user: JWTPayload },
  ): Promise<FindMeResponseEntity> {
    return plainToClass(
      FindMeResponseEntity,
      await this.usersService.findOne(user.userId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Patches myself, requires auth bearer token.',
    summary: 'Patch myself',
  })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateUserResponseEntity })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED])
  @UseGuards(JwtAuthGuard, DisableForPlatformUsersGuard)
  @Patch('me')
  async updateMe(
    @Request() { user }: { user: JWTPayload },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponseEntity> {
    return plainToClass(
      UpdateUserResponseEntity,
      await this.usersService.update(user.userId, updateUserDto),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    description: 'Deletes myself, requires auth bearer token.',
    summary: 'Delete myself',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponseInvalid([HttpStatus.UNAUTHORIZED])
  @UseGuards(JwtAuthGuard, DisableForPlatformUsersGuard)
  @Delete('me')
  async removeMe(@Request() { user }: { user: JWTPayload }) {
    await this.usersService.remove(user.userId);
  }

  @ApiOperation({
    description: 'Finds a user from a given id.',
    summary: 'Find user by id',
  })
  @ApiResponse({ status: HttpStatus.OK, type: FindOneUserResponseEntity })
  @ApiResponseInvalid([HttpStatus.NOT_FOUND], { isRateLimited: false })
  @SkipThrottle()
  @Get(':id')
  async findOne(
    @Param() params: UserParamsDto,
  ): Promise<FindOneUserResponseEntity> {
    return plainToClass(
      FindOneUserResponseEntity,
      await this.usersService.findOne(params.id),
    );
  }

  @ApiOperation({
    description:
      'Verifies confirmation token which is used to log a user into an external platform.',
    summary: 'Verify confirmation token',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: FindMeResponseEntity })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST, HttpStatus.FORBIDDEN])
  @Post('verify-confirmation-token')
  async verifyConfirmationToken(
    @Query() { token }: TokenQueryParamDto,
  ): Promise<FindMeResponseEntity> {
    return plainToClass(
      FindMeResponseEntity,
      await this.usersService.verifyConfirmationToken(token),
    );
  }

  @ApiOperation({
    description:
      'Resend email confirmation token if user has not been validated yet.',
    summary: 'Resend confirmation email',
  })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST])
  @Post('resend-confirmation-token')
  async resendConfirmationToken(
    @Query() { email }: ResendConfirmationTokenDto,
  ) {
    await this.usersService.resendConfirmationToken(email);
  }

  @ApiOperation({
    description: 'Request password reset email for a specified email.',
    summary: 'Request password reset',
  })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST])
  @Post('request-password-reset-token')
  async requestPasswordResetToken(@Query() { email }: PasswordResetRequestDto) {
    await this.usersService.requestPasswordReset(email);
  }

  @ApiOperation({
    description: 'Reset password from a valid request password reset token.',
    summary: 'Reset password',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: FindMeResponseEntity })
  @ApiResponseInvalid([HttpStatus.BAD_REQUEST, HttpStatus.FORBIDDEN])
  @Post('password-reset')
  async passwordReset(
    @Query() { token }: TokenQueryParamDto,
    @Body() { password }: PasswordResetDto,
  ): Promise<FindMeResponseEntity> {
    return plainToClass(
      FindMeResponseEntity,
      await this.usersService.passwordReset(token, password),
    );
  }
}
