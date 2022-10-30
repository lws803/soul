import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailModule } from 'src/mail/mail.module';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PrismaService } from 'src/prisma/prisma.service';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken]), MailModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
