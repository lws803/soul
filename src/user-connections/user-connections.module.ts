import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from 'src/users/users.module';
import { ActivityModule } from 'src/activity/activity.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { UserConnectionsService } from './user-connections.service';
import { UserConnectionsController } from './user-connections.controller';
import { UserConnection } from './entities/user-connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserConnection]),
    UsersModule,
    ActivityModule,
  ],
  controllers: [UserConnectionsController],
  providers: [UserConnectionsService, PrismaService],
  exports: [UserConnectionsService],
})
export class UserConnectionsModule {}
