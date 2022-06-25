import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamedIsRevokedCol1656168925233 implements MigrationInterface {
  name = 'RenamedIsRevokedCol1656168925233';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` CHANGE \`isRevoked\` \`is_revoked\` tinyint NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` CHANGE \`is_revoked\` \`isRevoked\` tinyint NOT NULL`,
    );
  }
}
