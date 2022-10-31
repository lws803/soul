import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prismaService: PrismaService) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredRefreshTokens() {
    this.logger.debug('Deleting expired refresh tokens...');
    this.logger.log({
      refreshTokensCountBeforeDelete:
        await this.prismaService.refreshToken.count(),
    });

    await this.prismaService.refreshToken.deleteMany({
      where: { OR: [{ expires: { lte: new Date() } }, { isRevoked: true }] },
    });

    // Deletes all refresh tokens for platform users with count above 10
    await this.prismaService.$executeRaw`
      DELETE tokens FROM refresh_tokens tokens JOIN
        (
          SELECT user_id, platform_user_id, COUNT(*) as cnt
            FROM refresh_tokens GROUP BY user_id, platform_user_id HAVING cnt > 10
        )
        tmp ON tmp.platform_user_id = tokens.platform_user_id;
    `;

    this.logger.debug('Deleted all expired refresh tokens');
    this.logger.log({
      refreshTokensCountAfterDelete:
        await this.prismaService.refreshToken.count(),
    });
  }
}
