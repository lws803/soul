import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

import { BadHealthcheckException } from './common/exceptions/bad-healthcheck.exception';

@Injectable()
export class AppService {
  constructor(private dbSession: Connection) {}

  async getHealthcheck(): Promise<{ status: 'OK' }> {
    if (!this.dbSession.isConnected) {
      throw new BadHealthcheckException();
    }
    return { status: 'OK' };
  }
}
