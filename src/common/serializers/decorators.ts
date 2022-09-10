import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SchemaObjectMetadata } from '@nestjs/swagger/dist/interfaces/schema-object-metadata.interface';
import { Expose } from 'class-transformer';

export function ApiResponseProperty({
  name,
  example,
  type,
}: {
  name: SchemaObjectMetadata['name'];
  example?: SchemaObjectMetadata['example'];
  type?: SchemaObjectMetadata['type'];
  description?: SchemaObjectMetadata['description'];
}) {
  return applyDecorators(ApiProperty({ name, example, required: false, type }));
}

export function ExposeApiResponseProperty(args?: { name?: string }) {
  return applyDecorators(Expose({ toPlainOnly: true, name: args?.name }));
}
