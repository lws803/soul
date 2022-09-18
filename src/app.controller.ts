import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { AppService } from './app.service';
import { LocalIpWhitelistInterceptor } from './common/interceptors/local-ip-whitelist.interceptor';

@Controller()
@UseInterceptors(LocalIpWhitelistInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  // TODO: Maybe re-expose this endpoint again
  @ApiExcludeEndpoint()
  @Get('healthcheck')
  async healthcheck(): Promise<{ status: 'OK' }> {
    return await this.appService.healthcheck();
  }
}
