import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformRedirectUris1643963133034 implements MigrationInterface {
  name = 'PlatformRedirectUris1643963133034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`redirect_uris\` json NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`redirect_uris\``,
    );
  }
}
