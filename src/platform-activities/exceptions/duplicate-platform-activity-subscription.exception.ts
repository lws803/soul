import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class DuplicatePlatformActivitySubscriptionException extends GenericException {
  constructor(fromPlatformId: number, toPlatformId: number) {
    super(
      {
        message: `An activity subscription from id: ${fromPlatformId} to id: ${toPlatformId} already exists`,
        error: 'DUPLICATE_PLATFORM_ACTIVITY_SUBSCRIPTION',
      },
      HttpStatus.CONFLICT,
    );
  }
}
