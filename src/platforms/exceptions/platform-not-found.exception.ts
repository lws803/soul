import { HttpException, HttpStatus } from '@nestjs/common';

export class PlatformNotFoundException extends HttpException {
  constructor({ id }: { id: number }) {
    super(
      {
        message: `The platform with id: ${id} was not found, please try again.`,
        error: 'PLATFORM_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
