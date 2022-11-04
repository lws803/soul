import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicatePlatformException extends GenericException {
  constructor(name: string) {
    super(
      {
        message: `The platform with name: ${name} already exists.`,
        error: 'DUPLICATE_PLATFORM_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
