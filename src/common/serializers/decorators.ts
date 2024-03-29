import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { SchemaObjectMetadata } from '@nestjs/swagger/dist/interfaces/schema-object-metadata.interface';
import { Expose } from 'class-transformer';

function SwaggerApiResponseProperty({
  name,
  ...args
}: ApiResponsePropertyArgs) {
  return applyDecorators(ApiProperty({ name, required: false, ...args }));
}

function ExposeApiResponseProperty(name: string) {
  return applyDecorators(Expose({ toPlainOnly: true, name }));
}

export function ApiResponseProperty({
  name,
  ...args
}: ApiResponsePropertyArgs) {
  return applyDecorators(
    SwaggerApiResponseProperty({ name, ...args }),
    ExposeApiResponseProperty(name),
  );
}

type ApiResponsePropertyArgs = { name: string } & Omit<
  SchemaObjectMetadata,
  'name'
>;

type InvalidTypes =
  | HttpStatus.CONFLICT
  | HttpStatus.FORBIDDEN
  | HttpStatus.BAD_REQUEST
  | HttpStatus.UNAUTHORIZED
  | HttpStatus.NOT_FOUND;

export function ApiResponseInvalid(
  invalidTypes: InvalidTypes[],
  options: { isRateLimited: boolean } = { isRateLimited: true },
) {
  const errorMessageSchema = {
    type: 'object',
    properties: {
      error: {
        description: 'Error code for easier categorization.',
        type: 'string',
      },
      message: {
        description: 'Human-readable error message describing the issue.',
        type: 'string',
      },
    },
  };
  const apiResponses: typeof ApiResponse[] = [];
  if (options.isRateLimited) {
    apiResponses.push(
      ApiResponse({
        status: HttpStatus.TOO_MANY_REQUESTS,
        schema: errorMessageSchema,
        description:
          'Too many requests were sent out to this API in a short period of time. ' +
          'We recommend using an exponential backoff for your requests.',
      }),
    );
  }
  if (invalidTypes.includes(HttpStatus.UNAUTHORIZED)) {
    apiResponses.push(
      ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        schema: errorMessageSchema,
        description: 'Your access to this resource is unauthorized.',
      }),
    );
  }
  if (invalidTypes.includes(HttpStatus.CONFLICT)) {
    apiResponses.push(
      ApiResponse({
        status: HttpStatus.CONFLICT,
        schema: errorMessageSchema,
        description:
          'The resource you are trying to create already exists, resulting in a conflict.',
      }),
    );
  }
  if (invalidTypes.includes(HttpStatus.FORBIDDEN)) {
    apiResponses.push(
      ApiResponse({
        status: HttpStatus.FORBIDDEN,
        schema: errorMessageSchema,
        description: 'Your access to this resource is forbidden.',
      }),
    );
  }
  if (invalidTypes.includes(HttpStatus.BAD_REQUEST)) {
    apiResponses.push(
      ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        schema: {
          type: 'object',
          properties: {
            ...errorMessageSchema.properties,
            constraints: {
              type: 'array',
              description:
                'List of constraint issues identified by class validator.',
              items: { type: 'string' },
            },
          },
        },
        description:
          'Bad request or api usage, usually due to incorrect value types passed in the request ' +
          'body or param.',
      }),
    );
  }
  if (invalidTypes.includes(HttpStatus.NOT_FOUND)) {
    apiResponses.push(
      ApiResponse({
        status: HttpStatus.NOT_FOUND,
        schema: errorMessageSchema,
        description: 'The resource you are looking for cannot be found.',
      }),
    );
  }

  return applyDecorators(...apiResponses);
}
