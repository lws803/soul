import { MigrationInterface, QueryRunner } from 'typeorm';

export class URLsForPlatformUserAndPlatform1666497469321
  implements MigrationInterface
{
  name = 'URLsForPlatformUserAndPlatform1666497469321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`homepage_url\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platform_users\` ADD \`user_url\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platform_users\` DROP COLUMN \`user_url\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`homepage_url\``,
    );
  }
}
