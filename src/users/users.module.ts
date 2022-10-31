import { Module } from '@nestjs/common';

import { MailModule } from 'src/mail/mail.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
