import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class PlatformNotFoundException extends GenericException {
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
