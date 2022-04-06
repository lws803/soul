import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(PlatformUser)
    private platformUsersRepository: Repository<PlatformUser>,
    @InjectRepository(UserConnection)
    private userConnectionsRepository: Repository<UserConnection>,
  ) {}

  async findOneUserReputation(
    userId: number,
  ): Promise<{ reputation: number; userId: number }> {
    const bannedPlatformsCount = await this.platformUsersRepository
      .createQueryBuilder('platform_user')
      .where('JSON_CONTAINS(roles, \'"banned"\') ' + 'AND user_id = :userId', {
        userId,
      })
      .getCount();

    const followerCount = await this.userConnectionsRepository.count({
      toUser: { id: userId },
    });
    // TODO: Add tests for this (e2e and unit)

    return {
      userId,
      reputation: followerCount + -1 * bannedPlatformsCount,
    };
  }
}
