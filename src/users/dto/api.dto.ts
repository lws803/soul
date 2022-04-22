import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsPasswordValid } from 'src/common/validators/password.validator';

export class CreateUserDto {
  @ApiProperty({ name: 'username', example: 'johndoe' })
  @MaxLength(32)
  username: string;

  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ name: 'password', example: 'very_strong_password' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsPasswordValid()
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({ name: 'username', example: 'johndoe', required: false })
  @IsOptional()
  @MaxLength(32)
  username?: string;

  @ApiProperty({ name: 'email', example: 'john@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UserParamsDto {
  @ApiProperty({ name: 'id', example: 1234, type: Number })
  @Type(() => Number)
  @IsInt()
  id: number;
}

export class ResendConfirmationTokenDto {
  @ApiProperty({
    name: 'email',
    example: 'john@email.com',
    type: String,
  })
  @IsString()
  @IsEmail()
  email: string;
}

export class TokenQueryParamDto {
  @ApiProperty({
    name: 'token',
    type: String,
  })
  @IsString()
  token: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({
    name: 'email',
    example: 'john@email.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({ name: 'username', example: 'johndoe', required: false })
  @IsOptional()
  @IsString()
  username?: string;
}

export class PasswordResetDto {
  @ApiProperty({ name: 'password', example: 'very_strong_password' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsPasswordValid()
  password: string;
}
