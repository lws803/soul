import { HttpStatus } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

export class MaxAdminRolesPerUserException extends GenericException {
  constructor({ max }: { max: number }) {
    super(
      {
        message: `Users can't hold more than ${max} admin roles`,
        error: 'MAX_ADMIN_ROLES_EXCEEDED_PER_USER',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
