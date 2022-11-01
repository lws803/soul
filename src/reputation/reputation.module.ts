import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UsersModule } from 'src/users/users.module';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

@Module({
  imports: [UsersModule],
  providers: [ReputationService, PrismaService],
  controllers: [ReputationController],
  exports: [ReputationService],
})
export class ReputationModule {}
