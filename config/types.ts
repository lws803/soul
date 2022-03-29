export type ConfigProperties = {
  DB_HOST: string;
  DB_PORT: number;
  DB_SSL: boolean;
  DB_USER: string;
  DB_PASSWORD?: string;
  DB_NAME: string;
  // Auth config
  JWT_SECRET_KEY: string;
  JWT_REFRESH_TOKEN_TTL: number;
  JWT_ACCESS_TOKEN_TTL: number;
  // Redis config
  REDIS_DB_HOST: string;
  REDIS_DB_PASSWORD?: string;
  REDIS_DB_INDEX: number;
  REDIS_DB_PORT: number;
  // Mail config
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_USERNAME?: string;
  MAIL_PASSWORD?: string;
  MAIL_FROM: string;
  MAIL_TOKEN_EXPIRATION_TIME: number;
  MAIL_TOKEN_SECRET: string;
  MAIL_CONFIRMATION_BASE_URL: string;
  MAIL_PASSWORD_RESET_BASE_URL: string;
  // Sentry config
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT: string;
};
