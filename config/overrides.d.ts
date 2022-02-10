import * as NestJSConfig from '@nestjs/config/dist/config.service';

import { ConfigProperties } from './types';

declare module '@nestjs/config' {
  export declare class ConfigService extends NestJSConfig.ConfigService<ConfigProperties> {}
}
