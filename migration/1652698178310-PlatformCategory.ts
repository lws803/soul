import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformCategory1652698178310 implements MigrationInterface {
  name = 'PlatformCategory1652698178310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`platform_categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_6b0e6556c6dddaad1ab2c6fbe5\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`platform_category_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD CONSTRAINT \`FK_36ae51f292e99bb131443b47390\` FOREIGN KEY (\`platform_category_id\`) REFERENCES \`platform_categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP FOREIGN KEY \`FK_36ae51f292e99bb131443b47390\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`platform_category_id\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6b0e6556c6dddaad1ab2c6fbe5\` ON \`platform_categories\``,
    );
    await queryRunner.query(`DROP TABLE \`platform_categories\``);
  }
}
