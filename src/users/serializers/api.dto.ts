import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { PaginationParamsDto } from 'src/common/serializers/pagination-params.dto';
import { IsPasswordValid } from 'src/common/validators/password.validator';

export class CreateUserDto {
  @ApiProperty({ name: 'username', example: 'johndoe' })
  @Matches(/^[a-z0-9-]*$/, {
    message:
      'Username can only contain lowercase alphanumeric characters with the exception of hyphens.',
  })
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

  @ApiProperty({ name: 'display_name', example: 'John Doe', required: false })
  @Expose({ name: 'display_name' })
  @ValidateIf((_object, value) => value !== null)
  @IsOptional()
  @MaxLength(32)
  displayName?: string | null;

  @ApiProperty({ name: 'bio', example: 'User bio.', required: false })
  @ValidateIf((_object, value) => value !== null)
  @IsOptional()
  @MaxLength(255)
  bio?: string | null;
}

export class UpdateUserDto {
  @ApiProperty({ name: 'username', example: 'johndoe', required: false })
  @IsOptional()
  @Matches(/^[a-z0-9-]*$/, {
    message:
      'Username can only contain lowercase alphanumeric characters with the exception of hyphens.',
  })
  @MaxLength(32)
  username?: string;

  @ApiProperty({ name: 'email', example: 'john@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ name: 'display_name', example: 'John Doe', required: false })
  @Expose({ name: 'display_name' })
  @ValidateIf((_object, value) => value !== null)
  @IsOptional()
  @MaxLength(32)
  displayName?: string | null;

  @ApiProperty({ name: 'bio', example: 'User bio.', required: false })
  @ValidateIf((_object, value) => value !== null)
  @IsOptional()
  @MaxLength(255)
  bio?: string | null;
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
    required: true,
  })
  @IsString()
  @IsEmail()
  email: string;
}

export class PasswordResetDto {
  @ApiProperty({ name: 'password', example: 'very_strong_password' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsPasswordValid()
  password: string;
}

export class FindAllUsersQueryParamDto extends PaginationParamsDto {
  @ApiProperty({
    name: 'q',
    example: 'john',
    description: 'Search query',
    required: false,
  })
  @IsOptional()
  @MaxLength(32)
  q?: string;
}
