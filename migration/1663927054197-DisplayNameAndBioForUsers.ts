import { MigrationInterface, QueryRunner } from 'typeorm';

export class DisplayNameAndBioForUsers1663927054197
  implements MigrationInterface
{
  name = 'DisplayNameAndBioForUsers1663927054197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`display_name\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`bio\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`bio\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`display_name\``,
    );
  }
}
