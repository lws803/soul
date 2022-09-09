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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { SkipThrottle } from '@nestjs/throttler';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';

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

@Controller({ version: '1', path: 'users' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ description: 'Creates a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateUserResponseEntity })
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponseEntity> {
    return plainToClass(
      CreateUserResponseEntity,
      await this.usersService.create(createUserDto),
    );
  }

  @ApiOperation({ description: 'Lists all users' })
  @ApiResponse({ status: HttpStatus.OK, type: FindAllUserResponseEntity })
  @Get()
  async findAll(
    @Query() queryParams: FindAllUsersQueryParamDto,
  ): Promise<FindAllUserResponseEntity> {
    return plainToClass(
      FindAllUserResponseEntity,
      await this.usersService.findAll(queryParams),
    );
  }

  @ApiOperation({ description: 'Retrieve myself (requires auth bearer token)' })
  @ApiResponse({ status: HttpStatus.OK, type: FindMeResponseEntity })
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

  @ApiOperation({ description: 'Patch myself (requires auth bearer token)' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateUserResponseEntity })
  @UseGuards(JwtAuthGuard)
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

  @ApiOperation({ description: 'Deletes myself (requires auth bearer token)' })
  @ApiResponse({ status: HttpStatus.OK })
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async removeMe(@Request() { user }: { user: JWTPayload }) {
    await this.usersService.remove(user.userId);
  }

  @ApiOperation({ description: 'Finds a user from a given id' })
  @ApiResponse({ status: HttpStatus.OK, type: FindOneUserResponseEntity })
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
      'Verifies confirmation token which is used to log a user into an external platform',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: FindMeResponseEntity })
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
      'Resend email confirmation token if user has not been validated yet',
  })
  @ApiResponse({ status: HttpStatus.CREATED })
  @Post('resend-confirmation-token')
  async resendConfirmationToken(
    @Query() { email }: ResendConfirmationTokenDto,
  ) {
    await this.usersService.resendConfirmationToken(email);
  }

  @ApiOperation({
    description: 'Request password reset email for a specified email',
  })
  @ApiResponse({ status: HttpStatus.CREATED })
  @Post('request-password-reset-token')
  async requestPasswordResetToken(@Query() { email }: PasswordResetRequestDto) {
    await this.usersService.requestPasswordReset(email);
  }

  @ApiOperation({
    description: 'Reset password from a valid request password reset token',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: FindMeResponseEntity })
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
