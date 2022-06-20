import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidRedirectUri(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsValidRedirectUri',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        ...validationOptions,
        message:
          'redirect_uris must adhere to the following restrictions ' +
          'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string' || value.length > 256) return false;

          try {
            const url = new URL(value);
            if (url.search !== '') return false;
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
              return true;

            if (url.protocol !== 'https:') return false;

            if (url.href.includes('*')) return false;
          } catch {
            return false;
          }

          return true;
        },
      },
    });
  };
}
