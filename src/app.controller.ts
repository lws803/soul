import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiExcludeEndpoint()
  @Get('healthcheck')
  async healthcheck(): Promise<{ status: 'OK' }> {
    return this.appService.healthcheck();
  }
}
