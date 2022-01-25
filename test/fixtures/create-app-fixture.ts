import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TestingModule, Test } from '@nestjs/testing';
import { ValidationError } from 'class-validator';

import { ValidationException } from 'src/common/exceptions/validation.exception';

import { AppModule } from './../../src/app.module';

export default async function createAppFixture({
  imports = [],
  ...args
}: Parameters<typeof Test.createTestingModule>[0]) {
  const module: TestingModule = await Test.createTestingModule({
    ...args,
    imports: [AppModule, ...imports],
  }).compile();
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        throw new ValidationException(validationErrors);
      },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );

  return app;
}
