import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async healthcheck(): Promise<{ status: 'OK' }> {
    return { status: 'OK' };
  }
}
