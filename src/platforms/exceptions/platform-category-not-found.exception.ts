import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class PlatformCategoryNotFoundException extends GenericException {
  constructor({ name }: { name: string }) {
    super(
      {
        message: `The category with name: ${name} was not found, please try again.`,
        error: 'PLATFORM_CATEGORY_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
