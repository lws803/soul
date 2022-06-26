import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { TasksService } from './tasks.service';

@Module({
  providers: [TasksService],
  imports: [TypeOrmModule.forFeature([RefreshToken])],
})
export class TasksModule {}
