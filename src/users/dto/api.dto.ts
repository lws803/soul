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
  @MaxLength(32)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsPasswordValid()
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @MaxLength(32)
  username?: string;

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
