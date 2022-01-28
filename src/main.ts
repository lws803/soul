/* eslint-disable no-console */
import {
  VersioningType,
  ValidationPipe,
  ValidationError,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { textSync } from 'figlet';

import { AppModule } from './app.module';
import { ValidationException } from './common/exceptions/validation.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableVersioning({ type: VersioningType.URI });
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

  const config = new DocumentBuilder()
    .setTitle('Soul')
    .setDescription('Soul Swagger API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(helmet());

  await app.listen(3000);

  console.log(
    textSync('Soul', {
      font: 'Epic',
      width: 80,
      whitespaceBreak: true,
    }),
  );
  console.log('Soul server started, listening on port 3000...');
}
bootstrap();
