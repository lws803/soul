import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'src/prisma/prisma.service';

import { TasksService } from './tasks.service';

describe(TasksService, () => {
  let service: TasksService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              deleteMany: jest.fn(),
              count: jest.fn().mockResolvedValue(2),
            },
            $executeRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('cleanupExpiredRefreshTokens()', () => {
    it('should delete expired refresh tokens', async () => {
      expect(await service.cleanupExpiredRefreshTokens());

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expires: { lte: expect.any(Date) } }, { isRevoked: true }],
        },
      });
      expect(prismaService.$executeRaw).toHaveBeenCalledWith([
        `
      DELETE tokens FROM refresh_tokens tokens JOIN
        (
          SELECT user_id, platform_user_id, COUNT(*) as cnt
            FROM refresh_tokens GROUP BY user_id, platform_user_id HAVING cnt > 10
        )
        tmp ON tmp.platform_user_id = tokens.platform_user_id;
    `,
      ]);
    });

    it('should count refresh tokens before and after deletion', async () => {
      expect(await service.cleanupExpiredRefreshTokens());
      expect(prismaService.refreshToken.count).toHaveBeenCalledTimes(2);
    });
  });
});
