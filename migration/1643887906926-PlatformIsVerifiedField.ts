import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformIsVerifiedField1643887906926
  implements MigrationInterface
{
  name = 'PlatformIsVerifiedField1643887906926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`is_verified\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`is_verified\``,
    );
  }
}
