import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SchemaObjectMetadata } from '@nestjs/swagger/dist/interfaces/schema-object-metadata.interface';
import { Expose } from 'class-transformer';

function SwaggerApiResponseProperty({
  name,
  example,
  type,
}: ApiResponsePropertyArgs) {
  return applyDecorators(ApiProperty({ name, example, required: false, type }));
}

function ExposeApiResponseProperty(args?: { name?: string }) {
  return applyDecorators(Expose({ toPlainOnly: true, name: args?.name }));
}

export function ApiResponseProperty({
  name,
  ...args
}: ApiResponsePropertyArgs) {
  return applyDecorators(
    SwaggerApiResponseProperty({ name, ...args }),
    ExposeApiResponseProperty({ name }),
  );
}

type ApiResponsePropertyArgs = {
  name: SchemaObjectMetadata['name'];
  example?: SchemaObjectMetadata['example'];
  type?: SchemaObjectMetadata['type'];
  description?: SchemaObjectMetadata['description'];
};
