import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from 'src/users/users.module';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';
import { Platform } from './entities/platform.entity';
import { PlatformUser } from './entities/platform-user.entity';
import { PlatformCategory } from './entities/platform-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Platform,
      PlatformUser,
      RefreshToken,
      PlatformCategory,
    ]),
    UsersModule,
  ],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
