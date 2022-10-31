import { Module } from '@nestjs/common';

import { UsersModule } from 'src/users/users.module';
import { ActivityModule } from 'src/activity/activity.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { UserConnectionsService } from './user-connections.service';
import { UserConnectionsController } from './user-connections.controller';

@Module({
  imports: [UsersModule, ActivityModule],
  controllers: [UserConnectionsController],
  providers: [UserConnectionsService, PrismaService],
  exports: [UserConnectionsService],
})
export class UserConnectionsModule {}
