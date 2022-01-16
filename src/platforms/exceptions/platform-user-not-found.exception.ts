import { HttpException, HttpStatus } from '@nestjs/common';

export class PlatformUserNotFoundException extends HttpException {
  constructor({
    username,
    platformName,
  }: {
    username: string;
    platformName: string;
  }) {
    super(
      {
        message: `The user with username: ${username} was not found on platform: ${platformName}, please try again.`,
        error: 'PLATFORM_USER_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
