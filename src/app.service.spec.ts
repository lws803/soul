import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';

import { AppService } from './app.service';

describe(AppService, () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: Connection,
          useValue: {
            isConnected: true,
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getHealthcheck()', () => {
    it('returns healthy', async () => {
      const result = await service.healthcheck();
      expect(result).toStrictEqual({ status: 'OK' });
    });
  });
});
