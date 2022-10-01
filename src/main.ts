/* eslint-disable no-console */
import { join } from 'path';

import {
  VersioningType,
  ValidationPipe,
  ValidationError,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import * as helmet from 'helmet';
import { textSync } from 'figlet';
import { RedocModule, RedocOptions } from 'nestjs-redoc';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { ValidationException } from './common/exceptions/validation.exception';

const PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.useLogger(app.get(PinoLogger));

  const configService = app.get(ConfigService);
  const logger = new Logger(bootstrap.name);
  const expressApp = app.getHttpAdapter().getInstance();

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
    .addServer('https://api.soul-network.com')
    .addServer('http://localhost:3000')
    .addSecurity('bearer', { type: 'http', scheme: 'bearer' })
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const redocOptions: RedocOptions = {
    title: 'Soul API docs',
    sortPropsAlphabetically: true,
    hideDownloadButton: false,
    hideHostname: false,
  };
  await RedocModule.setup('docs', app, document, redocOptions);

  app.use(helmet());

  if (configService.get('SENTRY_DSN')) {
    logger.log('SENTRY_DSN provided, initializing Sentry...');
    Sentry.init({
      dsn: configService.get('SENTRY_DSN'),
      environment: configService.get('SENTRY_ENVIRONMENT'),
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app: expressApp }),
      ],
      tracesSampleRate: 0.2,
    });

    expressApp.use(Sentry.Handlers.requestHandler());
    expressApp.use(Sentry.Handlers.tracingHandler());
    logger.log('Sentry initialized.');
  }

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  await app.listen(PORT);

  console.log(
    textSync('Soul', {
      font: 'Epic',
      width: 80,
      whitespaceBreak: true,
    }),
  );
  console.log(`Soul server started, listening on port ${PORT}...`);
}
bootstrap();
