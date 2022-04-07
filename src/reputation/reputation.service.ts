import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { UserConnection } from 'src/user-connections/entities/user-connection.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(PlatformUser)
    private platformUsersRepository: Repository<PlatformUser>,
    @InjectRepository(UserConnection)
    private userConnectionsRepository: Repository<UserConnection>,
    private usersService: UsersService,
  ) {}

  async findOneUserReputation(
    userId: number,
  ): Promise<{ reputation: number; userId: number }> {
    const user = await this.usersService.findOne(userId);

    const bannedPlatformsCount = await this.platformUsersRepository
      .createQueryBuilder('platform_user')
      .where('JSON_CONTAINS(roles, \'"banned"\') ' + 'AND user_id = :userId', {
        userId: user.id,
      })
      .getCount();

    const followerCount = await this.userConnectionsRepository.count({
      toUser: user,
    });

    return {
      userId: user.id,
      reputation: followerCount + -1 * bannedPlatformsCount,
    };
  }
}
