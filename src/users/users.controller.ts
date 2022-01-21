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
  NotImplementedException,
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

  @Get(':id')
  async findOne(
    @Param() params: UserParamsDto,
  ): Promise<FindOneUserResponseDto> {
    return new FindOneUserResponseDto(
      await this.usersService.findOne(params.id),
    );
  }

  @Patch(':id')
  async update(
    @Param() @Param() params: UserParamsDto,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    return new UpdateUserResponseDto(
      await this.usersService.update(params.id, updateUserDto),
    );
  }

  @Delete(':id')
  remove(@Param() params: UserParamsDto) {
    return this.usersService.remove(params.id);
  }

  @Post('verify_confirmation_token')
  async verifyConfirmationToken(
    @Query('token') token: string,
  ): Promise<GetMeUserResponseDto> {
    return new GetMeUserResponseDto(
      await this.usersService.verifyConfirmationToken(token),
    );
  }

  @Post('resend_confirmation_token')
  resendConfirmationToken(@Query() { email }: ResendConfirmationTokenDto) {
    return this.usersService.resendConfirmationToken(email);
  }

  @Post('request_password_reset_token')
  requestPasswordResetToken(
    @Query() { email, username }: PasswordResetRequestDto,
  ) {
    throw new NotImplementedException();
  }

  @Post('password_reset')
  passwordReset(@Body() { password }: PasswordResetDto) {
    throw new NotImplementedException();
  }
}
