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
} from '@nestjs/common';

import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JWTPayload } from 'src/auth/entities/jwt-payload.entity';

import { UsersService } from './users.service';
import {
  CreateUserDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  ResendEmailConfirmationDto as ResendConfirmationTokenDto,
  UpdateUserDto,
  UserParamsDto,
} from './dto/api.dto';
import {
  CreateUserResponseDto,
  FindAllUserResponseDto,
  FindOneUserResponseDto,
  GetMeUserResponseDto,
  UpdateUserResponseDto,
} from './dto/api-responses.dto';

@Controller({ version: '1', path: 'users' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    return new CreateUserResponseDto(
      await this.usersService.create(createUserDto),
    );
  }

  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<FindAllUserResponseDto> {
    return new FindAllUserResponseDto(
      await this.usersService.findAll(paginationParams),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(
    @Request() { user }: { user: JWTPayload },
  ): Promise<GetMeUserResponseDto> {
    return new GetMeUserResponseDto(
      await this.usersService.findOne(user.userId),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Request() { user }: { user: JWTPayload },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    return new UpdateUserResponseDto(
      await this.usersService.update(user.userId, updateUserDto),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async removeMe(@Request() { user }: { user: JWTPayload }) {
    await this.usersService.remove(user.userId);
  }

  @Get(':id')
  async findOne(
    @Param() params: UserParamsDto,
  ): Promise<FindOneUserResponseDto> {
    return new FindOneUserResponseDto(
      await this.usersService.findOne(params.id),
    );
  }

  @Post('verify-confirmation-token')
  async verifyConfirmationToken(
    @Query('token') token: string,
  ): Promise<GetMeUserResponseDto> {
    return new GetMeUserResponseDto(
      await this.usersService.verifyConfirmationToken(token),
    );
  }

  @Post('resend-confirmation-token')
  async resendConfirmationToken(
    @Query() { email }: ResendConfirmationTokenDto,
  ) {
    await this.usersService.resendConfirmationToken(email);
  }

  @Post('request-password-reset-token')
  async requestPasswordResetToken(@Query() { email }: PasswordResetRequestDto) {
    await this.usersService.requestPasswordReset(email);
  }

  @Post('password-reset')
  async passwordReset(
    @Query('token') token: string,
    @Body() { password }: PasswordResetDto,
  ) {
    return new GetMeUserResponseDto(
      await this.usersService.passwordReset(token, password),
    );
  }
}
