import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class PKCENotMatchException extends GenericException {
  constructor() {
    super(
      {
        message: 'Code challenge and code verifier does not match.',
        error: 'INVALID_CODE_CHALLENGE',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
