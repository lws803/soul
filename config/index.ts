import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

const schema = Joi.object({
  // DB config
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_SSL: Joi.boolean().default(false),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().optional().allow(''),
  DB_NAME: Joi.string().required(),
  // Auth config
  JWT_SECRET_KEY: Joi.string().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.string().required(),
  // Redis config
  REDIS_DB_HOST: Joi.string().required(),
  REDIS_DB_PASSWORD: Joi.string().optional().allow(''),
  REDIS_DB_INDEX: Joi.number().default(0),
  REDIS_DB_PORT: Joi.number().default(6379),
  // Mail config
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USERNAME: Joi.string().optional().allow(''),
  MAIL_PASSWORD: Joi.string().optional().allow(''),
  MAIL_FROM: Joi.string().required(),
  MAIL_TOKEN_EXPIRATION_TIME: Joi.number().required(),
  MAIL_TOKEN_SECRET: Joi.string().required(),
  MAIL_CONFIRMATION_BASE_URL: Joi.string().required(),
  MAIL_PASSWORD_RESET_BASE_URL: Joi.string().required(),
  // Sentry config
  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().default('local'),
});

const config: ConfigModuleOptions = {
  envFilePath: process.env.NODE_ENV
    ? [
        `${process.cwd()}/config/env/.env.${process.env.NODE_ENV}.local`,
        `${process.cwd()}/config/env/.env.${process.env.NODE_ENV}`,
      ]
    : [
        `${process.cwd()}/config/env/.env.development.local`,
        `${process.cwd()}/config/env/.env.development`,
      ],
  isGlobal: true,
  cache: true,
  validationSchema: schema,
};

export default config;
