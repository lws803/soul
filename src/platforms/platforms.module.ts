import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from 'src/users/users.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';
import { Platform } from './entities/platform.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Platform]), UsersModule],
  controllers: [PlatformsController],
  providers: [PlatformsService, PrismaService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
