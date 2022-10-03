import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientSecret1664825862418 implements MigrationInterface {
  name = 'AddClientSecret1664825862418';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`client_secret\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`client_secret\``,
    );
  }
}
