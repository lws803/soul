import { Test, TestingModule } from '@nestjs/testing';

import { PlatformActivitiesController } from './platform-activities.controller';
import { PlatformActivitiesService } from './platform-activities.service';

describe('PlatformActivitiesController', () => {
  let controller: PlatformActivitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformActivitiesController],
      providers: [PlatformActivitiesService],
    }).compile();

    controller = module.get<PlatformActivitiesController>(
      PlatformActivitiesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
