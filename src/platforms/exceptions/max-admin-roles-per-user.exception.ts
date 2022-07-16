import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class MaxAdminRolesPerUserException extends GenericException {
  constructor(max: number) {
    super(
      {
        message: `You can't hold more than ${max} admin roles`,
        error: 'MAX_ADMIN_ROLES_EXCEEDED_PER_USER',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
