import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredRefreshTokens() {
    this.logger.debug('Deleting expired refresh tokens...');
    this.logger.log({
      refreshTokensCountBeforeDelete: await this.refreshTokenRepository.count(),
    });
    await this.refreshTokenRepository
      .createQueryBuilder('refresh_tokens')
      .delete()
      .where('refresh_tokens.expires <= :currentDate', {
        currentDate: new Date(),
      })
      .orWhere('refresh_tokens.is_revoked = :isRevoked', { isRevoked: true })
      .execute();

    // Deletes all refresh tokens for platform users with count above 10
    await this.refreshTokenRepository.manager.query(
      `DELETE tokens FROM refresh_tokens tokens JOIN
        (
          SELECT user_id, platform_user_id, COUNT(*) as cnt
            FROM refresh_tokens GROUP BY user_id, platform_user_id HAVING cnt > 10
        )
        tmp ON tmp.platform_user_id = tokens.platform_user_id;
      `,
    );

    this.logger.debug('Deleted all expired refresh tokens');
    this.logger.log({
      refreshTokensCountAfterDelete: await this.refreshTokenRepository.count(),
    });
  }
}
