import { ConnectionOptions } from 'typeorm';

export default {
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: '',
  database: 'soul_db_dev',
  synchronize: true,
  migrationsRun: true,
  dropSchema: false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: ['migration/*.ts'],
  cli: {
    entitiesDir: __dirname + '/**/*.entity{.ts,.js}',
    migrationsDir: 'migration',
  },
} as ConnectionOptions;
