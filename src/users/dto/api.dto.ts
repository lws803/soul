import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_REGEX = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

export class CreateUserDto {
  @MaxLength(32)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(PASSWORD_REGEX, {
    message: 'password too weak',
  })
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
  @Matches(PASSWORD_REGEX, {
    message: 'password too weak',
  })
  password: string;
}
