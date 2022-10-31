import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { TasksService } from './tasks.service';

@Module({
  providers: [TasksService, PrismaService],
})
export class TasksModule {}
