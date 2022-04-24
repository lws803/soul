import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformAndUserFullTextSearch1650829776046
  implements MigrationInterface
{
  name = 'PlatformAndUserFullTextSearch1650829776046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE FULLTEXT INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\` (\`username\`)`,
    );
    await queryRunner.query(
      `CREATE FULLTEXT INDEX \`IDX_6add27e349b6905c85e016fa2c\` ON \`platforms\` (\`name\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_6add27e349b6905c85e016fa2c\` ON \`platforms\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
  }
}
