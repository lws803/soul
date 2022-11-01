import { Injectable } from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/roles/role.enum';

import { ReputationResponseEntity } from './serializers/api-responses.entity';

@Injectable()
export class ReputationService {
  constructor(
    private usersService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async findOneUserReputation(
    userId: number,
  ): Promise<ReputationResponseEntity> {
    const user = await this.usersService.findOne(userId);

    const bannedPlatformsCount = await this.prismaService.platformUser.count({
      where: {
        roles: { array_contains: UserRole.Banned },
        userId: user.id,
      },
    });

    const followerCount = await this.prismaService.userConnection.count({
      where: { toUserId: user.id },
    });

    return {
      user,
      reputation: followerCount + -1 * bannedPlatformsCount,
    };
  }
}
