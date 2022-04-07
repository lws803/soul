import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';
import { UsersModule } from 'src/users/users.module';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformUser, UserConnection]),
    UsersModule,
  ],
  providers: [ReputationService],
  controllers: [ReputationController],
  exports: [ReputationService],
})
export class ReputationModule {}
