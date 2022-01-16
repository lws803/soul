import { ConfigModuleOptions } from '@nestjs/config';

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
};

export default config;
