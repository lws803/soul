import { Module } from '@nestjs/common';

import { PlatformsModule } from 'src/platforms/platforms.module';

import { PlatformUsersController } from './platform-users.controller';

@Module({
  imports: [PlatformsModule],
  controllers: [PlatformUsersController],
})
export class PlatformUsersModule {}
