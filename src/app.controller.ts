import { Controller, Get, UseInterceptors } from '@nestjs/common';

import { AppService } from './app.service';
import { LocalIpWhitelistInterceptor } from './common/interceptors/local-ip-whitelist.interceptor';

@Controller()
@UseInterceptors(LocalIpWhitelistInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('healthcheck')
  async getHealthcheck(): Promise<{ status: 'OK' }> {
    return await this.appService.getHealthcheck();
  }
}
