import { Module } from '@nestjs/common';

import { UsersModule } from 'src/users/users.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';

@Module({
  imports: [UsersModule],
  controllers: [PlatformsController],
  providers: [PlatformsService, PrismaService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
