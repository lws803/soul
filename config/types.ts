export type ConfigProperties = {
  DATABASE_URL: string;
  // Auth config
  JWT_SECRET_KEY: string;
  JWT_REFRESH_TOKEN_TTL: number;
  JWT_ACCESS_TOKEN_TTL: number;
  JWT_CLIENT_ACCESS_TOKEN_TTL: number;
  REFRESH_TOKEN_ROTATION: boolean;
  // Redis config
  REDIS_DB_HOST: string;
  REDIS_DB_PASSWORD?: string;
  REDIS_DB_INDEX: number;
  REDIS_DB_PORT: number;
  REDIS_DB_BG_QUEUE_KEY_PREFIX: string;
  REDIS_DB_THROTTLER_KEY_PREFIX: string;
  REDIS_DB_KEY_PREFIX: string;
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
  // PKCE auth
  PKCE_CODE_CHALLENGE_TTL: number;

  SOUL_DEFAULT_PLATFORM_ID: number;

  // Throttler
  THROTTLER_TTL: number;
  THROTTLER_LIMIT: number;
};
