import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlatformsModule } from 'src/platforms/platforms.module';
import { UsersModule } from 'src/users/users.module';
import { ActivityModule } from 'src/activity/activity.module';

import { UserConnectionsService } from './user-connections.service';
import { UserConnectionsController } from './user-connections.controller';
import { UserConnection } from './entities/user-connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserConnection]),
    UsersModule,
    PlatformsModule,
    ActivityModule,
  ],
  controllers: [UserConnectionsController],
  providers: [UserConnectionsService],
  exports: [UserConnectionsService],
})
export class UserConnectionsModule {}
