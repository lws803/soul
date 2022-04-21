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
  @ApiProperty({ name: 'username', example: 'johndoe' })
  @IsOptional()
  @MaxLength(32)
  username?: string;

  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UserParamsDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}

export class ResendEmailConfirmationDto {
  @IsString()
  @IsEmail()
  email: string;
}

export class PasswordResetRequestDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

export class PasswordResetDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsPasswordValid()
  password: string;
}
