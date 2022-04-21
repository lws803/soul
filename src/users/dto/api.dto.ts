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
  @ApiProperty({ name: 'id', example: 1234 })
  @Type(() => Number)
  @IsInt()
  id: number;
}

export class ResendEmailConfirmationDto {
  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @IsString()
  @IsEmail()
  email: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ name: 'email', example: 'john@email.com' })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({ name: 'username', example: 'johndoe' })
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
