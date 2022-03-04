import { registerDecorator, ValidationOptions } from 'class-validator';
import * as zxcvbn from 'zxcvbn';

export function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        ...validationOptions,
        message: 'password is too weak',
      },
      validator: {
        validate(value: any) {
          if (!value) {
            return false;
          }
          const result = zxcvbn(value);
          if (result.score === 0) {
            return false;
          }
          return true;
        },
      },
    });
  };
}
