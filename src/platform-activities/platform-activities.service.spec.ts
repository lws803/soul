import { Test, TestingModule } from '@nestjs/testing';

import { PlatformActivitiesService } from './platform-activities.service';

describe('PlatformActivitiesService', () => {
  let service: PlatformActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformActivitiesService],
    }).compile();

    service = module.get<PlatformActivitiesService>(PlatformActivitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
