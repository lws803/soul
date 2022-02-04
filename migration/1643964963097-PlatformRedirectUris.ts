import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformRedirectUris1643964963097 implements MigrationInterface {
  name = 'PlatformRedirectUris1643964963097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` CHANGE \`host_url\` \`redirect_uris\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`redirect_uris\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`redirect_uris\` json NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`redirect_uris\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`redirect_uris\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` CHANGE \`redirect_uris\` \`host_url\` varchar(255) NOT NULL`,
    );
  }
}
