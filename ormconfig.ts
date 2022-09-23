import fs = require('fs');

import { ConnectionOptions } from 'typeorm';

import { config } from 'dotenv';

const LOCAL_ENV_PATH = './config/env/.env.development.local';
const ENV_PATH = './config/env/.env.development';

if (fs.existsSync(LOCAL_ENV_PATH)) {
  config({ path: LOCAL_ENV_PATH });
} else {
  config({ path: ENV_PATH });
}

export default {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  synchronize: true,
  migrationsRun: true,
  dropSchema: false,
  entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
  migrations: ['migration/*.ts'],
  cli: {
    entitiesDir: __dirname + '/**/entities/*.entity{.ts,.js}',
    migrationsDir: 'migration',
  },
} as ConnectionOptions;
